from app.database import SessionLocal, engine
from app import models

db = SessionLocal()
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)
print("Database cleared and schema recreated.")
