def test_notice_end_to_end_api(client):
    # 1. Create notice via pasted text
    payload = {
        "title": "State Merit Scholarship Notice",
        "text": (
            "STATE SCHOLARSHIP BOARD\n"
            "Notice: Higher Education Merit Scholarship Scheme 2026\n"
            "Eligibility: Students with 80% aggregate score.\n"
            "Application Deadline: 10 December 2026.\n"
            "Required Documents: Income certificate, Academic marksheet.\n"
            "Application Fee: None.\n"
            "How to apply: Submit online at https://scholarships.state.gov.in"
        ),
        "language": "en"
    }

    res = client.post("/api/notices/text", json=payload)
    assert res.status_code == 201
    notice = res.json()
    notice_id = notice["id"]
    assert "SCHOLARSHIP" in notice["title"].upper()
    assert notice["processing_status"] == "analyzed"
    assert len(notice["checklist_tasks"]) >= 2
    assert len(notice["extracted_fields"]) >= 4

    # 2. Get notice details
    get_res = client.get(f"/api/notices/{notice_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == notice_id

    # 3. Update a checklist task
    first_task = notice["checklist_tasks"][0]
    task_id = first_task["id"]
    patch_res = client.patch(f"/api/checklist/{task_id}", json={"status": "completed"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "completed"

    # 4. Ask a question
    q_res = client.post(
        f"/api/notices/{notice_id}/questions",
        json={"question": "What is the application deadline?"}
    )
    assert q_res.status_code == 200
    msg = q_res.json()
    assert msg["role"] == "assistant"
    assert "10 December 2026" in msg["message"]

    # 5. Translate notice to Hindi
    trans_res = client.post(
        f"/api/notices/{notice_id}/translate",
        json={"target_language": "hi"}
    )
    assert trans_res.status_code == 200
    assert trans_res.json()["language"] == "hi"

    # 6. Verify stats reflect new notice & checklist update
    stats_res = client.get("/api/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_notices"] >= 1
    assert stats["total_completed_actions"] >= 1

    # 7. Delete notice
    del_res = client.delete(f"/api/notices/{notice_id}")
    assert del_res.status_code == 204

    # 8. Verify notice no longer exists
    assert client.get(f"/api/notices/{notice_id}").status_code == 404
