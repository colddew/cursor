from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from .database import engine, create_db_and_tables
from .models import Todo

app = FastAPI()

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/todos")
def get_todos():
    with Session(engine) as session:
        todos = session.exec(select(Todo)).all()
        return todos

@app.post("/todos")
def create_todo(todo: Todo):
    with Session(engine) as session:
        session.add(todo)
        session.commit()
        session.refresh(todo)
        return todo

@app.put("/todos/{todo_id}")
def update_todo(todo_id: int, completed: bool):
    with Session(engine) as session:
        todo = session.get(Todo, todo_id)
        if todo:
            todo.completed = completed
            session.commit()
            session.refresh(todo)
        return todo

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    with Session(engine) as session:
        todo = session.get(Todo, todo_id)
        if todo:
            session.delete(todo)
            session.commit()
        return {"message": "Todo deleted"} 