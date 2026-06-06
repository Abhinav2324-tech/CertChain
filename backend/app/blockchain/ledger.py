import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from .. import models


def add_certificate_block(db: Session, certificate_id: str, certificate_hash: str) -> models.Blockchain:
    previous_block = db.query(models.Blockchain).order_by(models.Blockchain.id.desc()).first()
    previous_hash = previous_block.block_hash if previous_block else "GENESIS"

    block_hash = hashlib.sha256((certificate_hash + previous_hash).encode()).hexdigest()

    block = models.Blockchain(
        certificate_id=certificate_id,
        certificate_hash=certificate_hash,
        previous_hash=previous_hash,
        block_hash=block_hash,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    db.add(block)
    return block


def rechain_from_certificate(db: Session, certificate_id: str) -> None:
    """
    Recompute the updated certificate's block and all following blocks so
    previous_hash/block_hash links remain valid after certificate updates.
    """
    current_block = (
        db.query(models.Blockchain)
        .filter(models.Blockchain.certificate_id == certificate_id)
        .first()
    )
    if not current_block:
        return

    ordered_blocks = (
        db.query(models.Blockchain)
        .filter(models.Blockchain.id >= current_block.id)
        .order_by(models.Blockchain.id.asc())
        .all()
    )
    previous_block = (
        db.query(models.Blockchain)
        .filter(models.Blockchain.id < current_block.id)
        .order_by(models.Blockchain.id.desc())
        .first()
    )
    previous_hash = previous_block.block_hash if previous_block else "GENESIS"

    for block in ordered_blocks:
        certificate = (
            db.query(models.Certificate)
            .filter(models.Certificate.certificate_id == block.certificate_id)
            .first()
        )
        if certificate:
            block.certificate_hash = certificate.certificate_hash
        block.previous_hash = previous_hash
        block.block_hash = hashlib.sha256(
            (block.certificate_hash + block.previous_hash).encode("utf-8")
        ).hexdigest()
        block.timestamp = datetime.now(timezone.utc).isoformat()
        previous_hash = block.block_hash
