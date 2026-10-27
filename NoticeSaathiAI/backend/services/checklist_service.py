from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import ChecklistTask, Notice

class ChecklistService:
    @staticmethod
    def generate_checklist_from_extraction(
        notice_data: Dict[str, Any],
        extracted_fields: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Derives an ordered, evidence-backed action checklist from extracted notice data.
        Distinguishes confirmed official requirements from practical suggested recommendations.
        Never fabricates deadlines or application channels.
        """
        checklist = []
        order = 1

        # Look up key extracted fields
        field_map = {f.get("field_name"): f for f in extracted_fields}
        
        eligibility = field_map.get("eligibility_requirements", {})
        documents = field_map.get("required_documents", {})
        procedure = field_map.get("application_procedure", {})
        deadline = field_map.get("application_deadline", {})
        fees = field_map.get("fees", {})
        actions_field = field_map.get("required_actions", {})

        verified_deadline = (
            deadline.get("extracted_value") 
            if deadline.get("status") == "found" and deadline.get("is_verified") 
            else None
        )

        # 1. Eligibility Check Action
        if eligibility.get("status") == "found" and eligibility.get("extracted_value"):
            checklist.append({
                "task_title": "Confirm Eligibility Requirements",
                "description": f"Verify that you satisfy the criteria: {eligibility.get('extracted_value')}",
                "supporting_evidence_ref": eligibility.get("supporting_quotation"),
                "deadline": verified_deadline,
                "is_confirmed_requirement": True,
                "status": "pending",
                "order_index": order
            })
            order += 1

        # 2. Document Collection Action
        if documents.get("status") == "found" and documents.get("extracted_value"):
            checklist.append({
                "task_title": "Gather Required Documents",
                "description": f"Collect all mandatory certificates/papers: {documents.get('extracted_value')}",
                "supporting_evidence_ref": documents.get("supporting_quotation"),
                "deadline": verified_deadline,
                "is_confirmed_requirement": True,
                "status": "pending",
                "order_index": order
            })
            order += 1

        # 3. Fee Payment (if stated)
        if fees.get("status") == "found" and fees.get("extracted_value") and "not" not in fees.get("extracted_value").lower():
            checklist.append({
                "task_title": "Prepare & Pay Application Fee",
                "description": f"Applicable fee: {fees.get('extracted_value')}",
                "supporting_evidence_ref": fees.get("supporting_quotation"),
                "deadline": verified_deadline,
                "is_confirmed_requirement": True,
                "status": "pending",
                "order_index": order
            })
            order += 1

        # 4. Procedure / Submission
        if procedure.get("status") == "found" and procedure.get("extracted_value"):
            checklist.append({
                "task_title": "Submit Application as Prescribed",
                "description": procedure.get("extracted_value"),
                "supporting_evidence_ref": procedure.get("supporting_quotation"),
                "deadline": verified_deadline,
                "is_confirmed_requirement": True,
                "status": "pending",
                "order_index": order
            })
            order += 1

        # 5. Model-extracted specific required actions
        if actions_field.get("status") == "found" and actions_field.get("extracted_value"):
            raw_actions = actions_field.get("extracted_value")
            # If multiple items are separated by newlines or semicolons
            action_lines = [a.strip() for a in raw_actions.split("\n") if a.strip()]
            for act in action_lines:
                clean_act = act.lstrip("0123456789.-*• ")
                # Check for duplication with existing titles
                if not any(clean_act.lower() in t["task_title"].lower() for t in checklist) and len(clean_act) > 5:
                    checklist.append({
                        "task_title": clean_act[:80],
                        "description": clean_act,
                        "supporting_evidence_ref": actions_field.get("supporting_quotation"),
                        "deadline": verified_deadline,
                        "is_confirmed_requirement": True,
                        "status": "pending",
                        "order_index": order
                    })
                    order += 1

        # 6. Practical Confirmation Step (Suggested, not official requirement)
        checklist.append({
            "task_title": "Save Acknowledgement / Receipt",
            "description": "Retain a physical or digital copy of the submission acknowledgement, roll number, or transaction slip.",
            "supporting_evidence_ref": None,
            "deadline": None,
            "is_confirmed_requirement": False,  # Helpful best practice
            "status": "pending",
            "order_index": order
        })

        return checklist

    @staticmethod
    def sync_to_db(db: Session, notice_id: int, checklist_data: List[Dict[str, Any]]) -> List[ChecklistTask]:
        """Saves generated checklist tasks to database."""
        # Remove existing tasks if regenerating
        db.query(ChecklistTask).filter(ChecklistTask.notice_id == notice_id).delete()
        
        created_tasks = []
        for item in checklist_data:
            task = ChecklistTask(
                notice_id=notice_id,
                task_title=item["task_title"],
                description=item.get("description"),
                supporting_evidence_ref=item.get("supporting_evidence_ref"),
                deadline=item.get("deadline"),
                is_confirmed_requirement=item.get("is_confirmed_requirement", True),
                status=item.get("status", "pending"),
                order_index=item.get("order_index", 0)
            )
            db.add(task)
            created_tasks.append(task)
        
        db.commit()
        return created_tasks

checklist_service = ChecklistService()
