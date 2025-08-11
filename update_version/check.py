# #!/usr/bin/env python3
# """
# Mutawazi Financial Proposal System - FastAPI Backend
# A complete REST API for the financial proposal generation system
# """

# from fastapi import FastAPI, HTTPException, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import FileResponse, JSONResponse
# from pydantic import BaseModel, Field
# from typing import List, Dict, Optional, Any
# import pandas as pd
# from datetime import datetime, timedelta
# import json
# import os
# import uuid
# import io
# from pathlib import Path

# # Pydantic Models for Request/Response
# class ReadinessAssessment(BaseModel):
#     answers: List[bool] = Field(..., description="7 boolean answers for readiness questions")

# class ReadinessResponse(BaseModel):
#     score: int
#     status: str
#     can_proceed: bool
#     questions: List[str]

# class ProjectMetadata(BaseModel):
#     project_name_en: str = Field(..., description="Project name in English")
#     project_name_ar: str = Field(..., description="Project name in Arabic")
#     client_name_en: str = Field(..., description="Client name in English") 
#     client_name_ar: str = Field(..., description="Client name in Arabic")
#     project_type: str = Field(..., description="fixed, framework, or deliverable")
#     boq_type: str = Field(..., description="deliverable-based or monthly resources-based")
#     num_deliverables: int = Field(..., gt=0, description="Number of deliverables")
#     start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
#     end_date: str = Field(..., description="End date in YYYY-MM-DD format")
#     rfp_code: str = Field(..., description="RFP code from client")

# class DeliverableData(BaseModel):
#     name: str = Field(..., description="Deliverable name")
#     due_date: str = Field(..., description="Due date in YYYY-MM-DD format")
#     amount: float = Field(..., gt=0, description="Amount to charge client")
#     salaries: float = Field(..., ge=0, description="Salary costs")
#     tools: float = Field(..., ge=0, description="Tools/software costs")
#     others: float = Field(..., ge=0, description="Other expenses")

# class CashFlowRequest(BaseModel):
#     deliverables: List[DeliverableData]

# class PaymentTerm(BaseModel):
#     description: str = Field(..., description="Payment description")
#     percentage: float = Field(..., gt=0, le=100, description="Percentage of total amount")

# class ProposalItem(BaseModel):
#     description: str = Field(..., description="Item description")
#     quantity: int = Field(default=1, gt=0)
#     unit_price: float = Field(..., gt=0)
#     total_price: float = Field(..., gt=0)

# class FinalProposalRequest(BaseModel):
#     proposal_items: List[ProposalItem]
#     payment_terms: List[PaymentTerm]

# class OverheadCosts(BaseModel):
#     salaries: float = Field(default=50000)
#     utilities: float = Field(default=15000)
#     transportation: float = Field(default=10000)
#     visas: float = Field(default=8000)
#     office_rent: float = Field(default=20000)
#     insurance: float = Field(default=5000)

# # Initialize FastAPI app
# app = FastAPI(
#     title="Mutawazi Financial Proposal System",
#     description="API for generating financial proposals with cost analysis and cash flow planning",
#     version="1.0.0"
# )

# # CORS middleware for frontend integration
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Configure this for production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Global storage for proposal data (in production, use database)
# proposals_storage = {}
# current_session = {}

# # Pre-loaded data
# READINESS_QUESTIONS = [
#     "I have read and understood the scope",
#     "This project is within our mandate",
#     "I have aligned internally that I will do pricing",
#     "The contract type is understood (Fixed, Deliverables-Based, or Framework)",
#     "I have checked if there is an existing rate card or similar past proposal",
#     "I understand whether this is a monthly resource BoQ or milestone BoQ",
#     "I know the expected duration of the project or agreement"
# ]

# SERVICES_CATALOG = {
#     '1.1': {'name': 'AI Governance Framework Development', 'price': 40000, 'duration': 12, 'unit': 'Service'},
#     '1.2': {'name': 'AI Trustworthiness & Risk Assessment', 'price': 30000, 'duration': 2, 'unit': 'Service'},
#     '1.3': {'name': 'Ethical AI Policy & Compliance Strategy', 'price': 15000, 'duration': 3, 'unit': 'Service'},
#     '2.1': {'name': 'AI-Driven PMO Setup & Consultancy', 'price': 300000, 'duration': 12, 'unit': 'Service'},
#     '2.2': {'name': 'AI Project Tracker & Risk Prediction Tool', 'price': 350000, 'duration': 4, 'unit': 'Service'},
#     '3.1': {'name': 'AI Maturity & Impact Assessment', 'price': 200000, 'duration': 2, 'unit': 'Service'},
#     '4.1': {'name': 'AI Solution Design & MVP Development', 'price': 725000, 'duration': 2, 'unit': 'Solution'},
#     '4.2': {'name': 'Advanced Analytics & BI Integration', 'price': 925000, 'duration': 9, 'unit': 'Solution'},
#     '5.1': {'name': 'AI Competency Development Programs', 'price': 250000, 'duration': 36, 'unit': 'Service'}
# }

# DEFAULT_OVERHEAD_COSTS = {
#     "salaries": 50000,
#     "utilities": 15000,
#     "transportation": 10000,
#     "visas": 8000,
#     "office_rent": 20000,
#     "insurance": 5000
# }

# # Utility functions
# def generate_quotation_code():
#     """Generate unique quotation code"""
#     return f"MUT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

# def calculate_duration_months(start_date: str, end_date: str) -> int:
#     """Calculate duration in months between two dates"""
#     start = datetime.strptime(start_date, '%Y-%m-%d')
#     end = datetime.strptime(end_date, '%Y-%m-%d')
#     return round((end - start).days / 30.44)

# def calculate_overhead(base_costs: float, overhead_costs: dict) -> float:
#     """Calculate overhead costs"""
#     total_monthly_overhead = sum(overhead_costs.values())
#     return base_costs * 0.15  # 15% overhead rate

# # API Endpoints

# @app.get("/")
# async def root():
#     """Welcome endpoint"""
#     return {
#         "message": "Welcome to Mutawazi Financial Proposal System API",
#         "version": "1.0.0",
#         "endpoints": {
#             "readiness": "/api/readiness",
#             "metadata": "/api/metadata", 
#             "cashflow": "/api/cashflow",
#             "proposal": "/api/proposal",
#             "services": "/api/services"
#         }
#     }

# @app.get("/api/welcome")
# async def get_welcome_message():
#     """Get the welcome message for the system"""
#     return {
#         "title": "Welcome to the Mutawazi Financial Pricing Model",
#         "description": "This tool is designed to support consistent, transparent, and scalable pricing across all project types, whether resource-based, deliverable-based, or framework agreements.",
#         "purpose": [
#             "Price projects based on clear logic and cost structure",
#             "Reflect project-specific assumptions (duration, scope, type)",
#             "Forecast internal costs and external revenue clearly",
#             "Justify pricing to clients with confidence",
#             "Export chatbot-ready summaries for automation"
#         ]
#     }

# @app.get("/api/readiness/questions")
# async def get_readiness_questions():
#     """Get readiness assessment questions"""
#     return {
#         "questions": READINESS_QUESTIONS,
#         "required_score": 6,
#         "total_questions": 7
#     }

# @app.post("/api/readiness/assess", response_model=ReadinessResponse)
# async def assess_readiness(assessment: ReadinessAssessment):
#     """Assess readiness based on answers"""
#     if len(assessment.answers) != 7:
#         raise HTTPException(status_code=400, detail="Must provide exactly 7 answers")
    
#     score = sum(assessment.answers)
    
#     if score >= 7:
#         status = "✅ Ready"
#         can_proceed = True
#     elif score >= 6:
#         status = "⚠️ Partial"
#         can_proceed = True
#     else:
#         status = "❌ Not Ready"
#         can_proceed = False
    
#     # Store in session
#     session_id = str(uuid.uuid4())
#     current_session[session_id] = {
#         "readiness": {
#             "score": score,
#             "status": status,
#             "can_proceed": can_proceed,
#             "answers": assessment.answers
#         }
#     }
    
#     return ReadinessResponse(
#         score=score,
#         status=status,
#         can_proceed=can_proceed,
#         questions=READINESS_QUESTIONS
#     )

# @app.post("/api/metadata")
# async def create_project_metadata(metadata: ProjectMetadata):
#     """Create and validate project metadata"""
#     try:
#         # Validate dates
#         start_date = datetime.strptime(metadata.start_date, '%Y-%m-%d')
#         end_date = datetime.strptime(metadata.end_date, '%Y-%m-%d')
        
#         if start_date >= end_date:
#             raise HTTPException(status_code=400, detail="End date must be after start date")
        
#         # Calculate duration
#         duration_months = calculate_duration_months(metadata.start_date, metadata.end_date)
        
#         # Generate automated fields
#         quotation_code = generate_quotation_code()
#         version_name = "v1.0"
#         created_on = datetime.now().strftime('%Y-%m-%d')
        
#         processed_metadata = {
#             **metadata.dict(),
#             'duration_months': duration_months,
#             'quotation_code': quotation_code,
#             'version_name': version_name,
#             'created_on': created_on
#         }
        
#         # Store in proposals
#         proposals_storage[quotation_code] = {
#             'metadata': processed_metadata,
#             'created_at': datetime.now().isoformat()
#         }
        
#         return {
#             "success": True,
#             "quotation_code": quotation_code,
#             "metadata": processed_metadata
#         }
        
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing metadata: {e}")

# @app.get("/api/services")
# async def get_services_catalog():
#     """Get available services catalog"""
#     return {
#         "services": SERVICES_CATALOG,
#         "total_services": len(SERVICES_CATALOG)
#     }

# @app.get("/api/services/{service_id}")
# async def get_service_by_id(service_id: str):
#     """Get specific service by ID"""
#     if service_id not in SERVICES_CATALOG:
#         raise HTTPException(status_code=404, detail="Service not found")
    
#     return {
#         "service_id": service_id,
#         **SERVICES_CATALOG[service_id]
#     }

# @app.post("/api/cashflow/deliverables")
# async def calculate_deliverable_cashflow(request: CashFlowRequest):
#     """Calculate deliverable-based cash flow"""
#     try:
#         deliverables = []
#         cumulative_net_flow = 0
        
#         for i, deliv_data in enumerate(request.deliverables):
#             # Calculate overhead
#             base_costs = deliv_data.salaries + deliv_data.tools + deliv_data.others
#             overhead = calculate_overhead(base_costs, DEFAULT_OVERHEAD_COSTS)
            
#             # Calculate totals
#             cash_out = base_costs + overhead
#             net_flow = deliv_data.amount - cash_out
#             cumulative_net_flow += net_flow
            
#             deliverable = {
#                 'deliverable_name': deliv_data.name,
#                 'due_date': deliv_data.due_date,
#                 'cash_in': deliv_data.amount,
#                 'salaries': deliv_data.salaries,
#                 'tools': deliv_data.tools,
#                 'others': deliv_data.others,
#                 'overhead': overhead,
#                 'cash_out': cash_out,
#                 'net_flow': net_flow,
#                 'cumulative_net_flow': cumulative_net_flow,
#                 'is_profitable': net_flow > 0
#             }
            
#             deliverables.append(deliverable)
        
#         # Calculate summary
#         total_revenue = sum(d['cash_in'] for d in deliverables)
#         total_costs = sum(d['cash_out'] for d in deliverables)
#         total_profit = total_revenue - total_costs
#         profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
#         return {
#             "deliverables": deliverables,
#             "summary": {
#                 "total_revenue": total_revenue,
#                 "total_costs": total_costs,
#                 "total_profit": total_profit,
#                 "profit_margin": round(profit_margin, 2),
#                 "is_profitable": total_profit > 0
#             }
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error calculating cash flow: {e}")

# @app.post("/api/proposal/create")
# async def create_financial_proposal(request: FinalProposalRequest):
#     """Generate final financial proposal"""
#     try:
#         # Validate payment terms
#         total_percentage = sum(term.percentage for term in request.payment_terms)
#         if abs(total_percentage - 100) > 0.01:
#             raise HTTPException(
#                 status_code=400, 
#                 detail=f"Payment terms must sum to 100%. Current sum: {total_percentage}%"
#             )
        
#         # Calculate total amount
#         total_amount = sum(item.total_price for item in request.proposal_items)
        
#         # Calculate payment amounts
#         payment_terms_with_amounts = []
#         for term in request.payment_terms:
#             payment_terms_with_amounts.append({
#                 "description": term.description,
#                 "percentage": term.percentage,
#                 "amount": total_amount * (term.percentage / 100)
#             })
        
#         # Generate proposal
#         quotation_code = generate_quotation_code()
#         proposal = {
#             'date': datetime.now().strftime('%Y-%m-%d'),
#             'offer_number': quotation_code,
#             'items': [item.dict() for item in request.proposal_items],
#             'total_amount': total_amount,
#             'payment_terms': payment_terms_with_amounts,
#             'currency': 'SAR',
#             'created_at': datetime.now().isoformat()
#         }
        
#         # Store proposal
#         proposals_storage[quotation_code] = {
#             'proposal': proposal,
#             'created_at': datetime.now().isoformat()
#         }
        
#         return {
#             "success": True,
#             "quotation_code": quotation_code,
#             "proposal": proposal
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error creating proposal: {e}")

# @app.get("/api/proposal/{quotation_code}")
# async def get_proposal(quotation_code: str):
#     """Get stored proposal by quotation code"""
#     if quotation_code not in proposals_storage:
#         raise HTTPException(status_code=404, detail="Proposal not found")
    
#     return proposals_storage[quotation_code]

# @app.get("/api/proposals")
# async def list_all_proposals():
#     """List all stored proposals"""
#     return {
#         "proposals": list(proposals_storage.keys()),
#         "total_count": len(proposals_storage)
#     }

# @app.get("/api/proposal/{quotation_code}/summary")
# async def get_proposal_summary(quotation_code: str):
#     """Get formatted proposal summary"""
#     if quotation_code not in proposals_storage:
#         raise HTTPException(status_code=404, detail="Proposal not found")
    
#     data = proposals_storage[quotation_code]
    
#     if 'metadata' in data and 'proposal' in data:
#         metadata = data['metadata']
#         proposal = data['proposal']
        
#         summary = f"""
# === MUTAWAZI FINANCIAL PROPOSAL ===

# Project: {metadata.get('project_name_en', 'N/A')} / {metadata.get('project_name_ar', 'N/A')}
# Client: {metadata.get('client_name_en', 'N/A')} / {metadata.get('client_name_ar', 'N/A')}
# RFP Code: {metadata.get('rfp_code', 'N/A')}
# Offer Number: {proposal['offer_number']}
# Date: {proposal['date']}
# Duration: {metadata.get('duration_months', 'N/A')} months

# PROJECT ITEMS:
# """
        
#         for i, item in enumerate(proposal['items'], 1):
#             summary += f"{i}. {item['description']}\n"
#             summary += f"   Quantity: {item.get('quantity', 1)} | Unit Price: {item.get('unit_price', 0):,.2f} SAR\n"
#             summary += f"   Total: {item.get('total_price', 0):,.2f} SAR\n\n"
        
#         summary += f"\nTOTAL PROJECT VALUE: {proposal['total_amount']:,.2f} SAR\n\n"
        
#         summary += "PAYMENT TERMS:\n"
#         for i, term in enumerate(proposal['payment_terms'], 1):
#             summary += f"{i}. {term['description']}: {term['percentage']}% = {term['amount']:,.2f} SAR\n"
        
#         return {"summary": summary}
    
#     return {"summary": "Incomplete proposal data"}

# @app.delete("/api/proposal/{quotation_code}")
# async def delete_proposal(quotation_code: str):
#     """Delete a proposal"""
#     if quotation_code not in proposals_storage:
#         raise HTTPException(status_code=404, detail="Proposal not found")
    
#     del proposals_storage[quotation_code]
#     return {"success": True, "message": f"Proposal {quotation_code} deleted"}

# @app.get("/api/overhead")
# async def get_overhead_costs():
#     """Get current overhead costs (admin only)"""
#     return {"overhead_costs": DEFAULT_OVERHEAD_COSTS}

# @app.put("/api/overhead")
# async def update_overhead_costs(overhead: OverheadCosts):
#     """Update overhead costs (admin only)"""
#     global DEFAULT_OVERHEAD_COSTS
#     DEFAULT_OVERHEAD_COSTS.update(overhead.dict())
#     return {
#         "success": True,
#         "updated_overhead_costs": DEFAULT_OVERHEAD_COSTS
#     }

# @app.get("/api/health")
# async def health_check():
#     """Health check endpoint"""
#     return {
#         "status": "healthy",
#         "timestamp": datetime.now().isoformat(),
#         "version": "1.0.0"
#     }

# # Error handlers
# @app.exception_handler(ValueError)
# async def value_error_handler(request, exc):
#     return JSONResponse(
#         status_code=400,
#         content={"detail": str(exc)}
#     )

# @app.exception_handler(Exception)
# async def general_exception_handler(request, exc):
#     return JSONResponse(
#         status_code=500,
#         content={"detail": "Internal server error"}
#     )

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)






