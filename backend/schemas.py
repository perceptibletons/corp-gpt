from pydantic import BaseModel, EmailStr
from typing import Optional, List

class SignupSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

class LoginSchema(BaseModel):
    username: str
    password: str

class OTPVerifySchema(BaseModel):
    username: str
    otp: str

class UploadResponse(BaseModel):
    message: str
    chunks_indexed: int

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    citations: List[dict]
