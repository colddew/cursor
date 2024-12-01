from sqlmodel import SQLModel, create_engine

DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/todo_db?charset=utf8mb4"

engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine) 