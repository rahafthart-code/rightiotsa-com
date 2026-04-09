from datetime import datetime, timedelta

from .database import SessionLocal
from .models import Animal, SpeciesEnum, Telemetry, User


def seed():
    db = SessionLocal()
    try:
        # Create or get the main test user (same as dev test login)
        email = "test@example.com"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(full_name="Test User", email=email, is_active=True)
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create or get a camel named Khozama (خزامة) with a sample device IMEI
        imei = "359881234567890"
        animal = db.query(Animal).filter(Animal.device_imei == imei).first()
        if not animal:
            animal = Animal(
                owner_id=user.id,
                name="Khozama",
                species=SpeciesEnum.CAMEL,
                device_imei=imei,
            )
            db.add(animal)
            db.commit()
            db.refresh(animal)

        # Seed 10 telemetry points along a simple path
        now = datetime.utcnow()
        base_lat = 24.7136  # Example around Riyadh
        base_lng = 46.6753

        existing_count = (
            db.query(Telemetry)
            .filter(Telemetry.device_imei == animal.device_imei)
            .count()
        )
        if existing_count == 0:
            records = []
            for i in range(10):
                ts = now - timedelta(minutes=10 - i)
                records.append(
                    Telemetry(
                        device_imei=animal.device_imei,
                        lat=base_lat + 0.01 * i,
                        lng=base_lng + 0.01 * i,
                        battery=max(5, 100 - i * 5),
                        status="Moving" if i % 2 == 0 else "Resting",
                        timestamp=ts,
                    )
                )
            db.add_all(records)
            db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()

