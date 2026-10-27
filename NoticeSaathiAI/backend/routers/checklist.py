from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import ChecklistTask, Notice
from ..schemas import ChecklistTaskSchema, ChecklistTaskUpdate, ChecklistTaskCreate

router = APIRouter(tags=["Checklist"])

@router.get("/api/notices/{notice_id}/checklist", response_model=List[ChecklistTaskSchema])
def get_notice_checklist(notice_id: int, db: Session = Depends(get_db)):
    """Retrieves all ordered checklist items for the given notice."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")
    
    tasks = db.query(ChecklistTask).filter(ChecklistTask.notice_id == notice_id).order_by(ChecklistTask.order_index).all()
    return tasks

@router.patch("/api/checklist/{task_id}", response_model=ChecklistTaskSchema)
def update_checklist_task(task_id: int, task_in: ChecklistTaskUpdate, db: Session = Depends(get_db)):
    """Updates completion status or details of a checklist task."""
    task = db.query(ChecklistTask).filter(ChecklistTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Checklist task with ID {task_id} not found.")
    
    if task_in.status is not None:
        valid_statuses = {"pending", "completed", "needs_clarification"}
        if task_in.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status '{task_in.status}'. Valid: {valid_statuses}")
        task.status = task_in.status
        if task_in.status == "completed":
            task.completed_at = datetime.utcnow()
        else:
            task.completed_at = None

    if task_in.task_title is not None:
        task.task_title = task_in.task_title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.deadline is not None:
        task.deadline = task_in.deadline
    if task_in.is_confirmed_requirement is not None:
        task.is_confirmed_requirement = task_in.is_confirmed_requirement

    db.commit()
    db.refresh(task)
    return task

@router.post("/api/notices/{notice_id}/checklist", response_model=ChecklistTaskSchema, status_code=status.HTTP_201_CREATED)
def add_checklist_task(notice_id: int, task_in: ChecklistTaskCreate, db: Session = Depends(get_db)):
    """Allows adding an additional custom action to a notice checklist."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")

    max_order = db.query(ChecklistTask).filter(ChecklistTask.notice_id == notice_id).count()
    new_task = ChecklistTask(
        notice_id=notice_id,
        task_title=task_in.task_title,
        description=task_in.description,
        supporting_evidence_ref=task_in.supporting_evidence_ref,
        deadline=task_in.deadline,
        is_confirmed_requirement=task_in.is_confirmed_requirement,
        status=task_in.status,
        order_index=task_in.order_index or (max_order + 1)
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task
