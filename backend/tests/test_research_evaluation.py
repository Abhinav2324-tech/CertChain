"""Pytest coverage for research evaluation metrics (see tests/research_metrics.py)."""

import os

import pytest
from fastapi.testclient import TestClient

from tests import research_metrics


@pytest.fixture()
def client() -> TestClient:
    assert ":memory:" in os.environ.get("CERTCHAIN_DATABASE_URL", "")
    from app.main import app

    return TestClient(app)


def test_multi_certificate_verify_all_valid(client: TestClient) -> None:
    report = research_metrics.build_evaluation_report(
        client, multi_certificate_count=12, verification_timing_iterations=20
    )
    m = report["multiple_certificates"]
    assert m["certificates_issued_and_verified"] == 12
    assert m["all_reported_valid_before_tamper_suite"] is True


def test_tamper_hashed_fields_all_caught(client: TestClient) -> None:
    report = research_metrics.build_evaluation_report(
        client, multi_certificate_count=5, verification_timing_iterations=5
    )
    td = report["tamper_detection"]
    hashed = [c for c in td["cases"] if c.get("category") == "hashed_field"]
    assert td["hashed_payload_cases_run"] == len(hashed)
    assert td["hashed_payload_cases_caught"] == len(hashed)
    assert td["hashed_payload_detection_rate"] == 1.0


def test_blockchain_integrity_holds_when_clean(client: TestClient) -> None:
    report = research_metrics.build_evaluation_report(
        client, multi_certificate_count=4, verification_timing_iterations=3
    )
    b = report["blockchain_chain_integrity"]
    assert b["validate_before_tamper_suite"]["valid"] is True
    assert b["validate_after_rolled_back_tampers"]["valid"] is True


def test_document_type_not_in_hash_stays_valid(client: TestClient) -> None:
    report = research_metrics.build_evaluation_report(
        client, multi_certificate_count=3, verification_timing_iterations=2
    )
    for c in report["tamper_detection"]["cases"]:
        if c.get("case") == "document_type_not_in_hash":
            assert c["observed_status"] == "valid"
            assert c["caught_as_expected"] is True
            return
    pytest.fail("document_type case missing")


def test_chain_mutations_flagged(client: TestClient) -> None:
    report = research_metrics.build_evaluation_report(
        client, multi_certificate_count=3, verification_timing_iterations=2
    )
    td = report["tamper_detection"]
    assert td["chain_only_mutation_cases_run"] == 2
    assert td["chain_only_mutation_cases_flagged_by_integrity_check"] == 2
