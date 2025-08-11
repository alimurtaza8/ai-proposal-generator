"""
Mermaid.js Diagram Generator for RFP Proposals
This module generates professional diagrams using Mermaid.js syntax
"""

import requests
import base64
import json
from typing import Optional

class MermaidDiagramGenerator:
    def __init__(self):
        # Using Mermaid.ink - free online service
        self.base_url = "https://mermaid.ink"
    
    def generate_timeline_diagram(self, phases: list, milestones: list) -> str:
        """Generate Gantt chart for project timeline"""
        mermaid_code = "gantt\n    title Project Timeline\n    dateFormat YYYY-MM-DD\n"
        
        for i, phase in enumerate(phases):
            section_name = f"section {phase['name']}"
            mermaid_code += f"    {section_name}\n"
            mermaid_code += f"    {phase['task']} :a{i+1}, {phase['start']}, {phase['duration']}\n"
        
        return self._generate_diagram_url(mermaid_code)
    
    def generate_architecture_diagram(self, components: list, connections: list) -> str:
        """Generate system architecture diagram"""
        mermaid_code = "graph TD\n"
        
        for component in components:
            mermaid_code += f"    {component['id']}[{component['name']}]\n"
        
        for connection in connections:
            mermaid_code += f"    {connection['from']} --> {connection['to']}\n"
        
        return self._generate_diagram_url(mermaid_code)
    
    def generate_modular_diagram(self, modules: list) -> str:
        """Generate modular solution diagram"""
        mermaid_code = "graph LR\n"
        
        for module in modules:
            mermaid_code += f"    {module['id']}[{module['name']}]\n"
            if 'children' in module:
                for child in module['children']:
                    mermaid_code += f"    {module['id']} --> {child['id']}[{child['name']}]\n"
        
        return self._generate_diagram_url(mermaid_code)
    
    def _generate_diagram_url(self, mermaid_code: str) -> str:
        """Convert Mermaid code to image URL"""
        # Encode the mermaid code
        encoded = base64.b64encode(mermaid_code.encode('utf-8')).decode('utf-8')
        
        # Return URL that generates the image
        return f"{self.base_url}/img/{encoded}"
    
    def generate_diagram_code_for_ai(self, diagram_type: str, context: str) -> str:
        """Generate Mermaid code that AI can include in proposals"""
        if diagram_type == "timeline":
            return """
```mermaid
gantt
    title Project Implementation Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Requirements Analysis :a1, 2024-01-01, 2w
    Design Phase        :a2, after a1, 3w
    section Development
    Core Development    :a3, after a2, 6w
    Integration Testing :a4, after a3, 2w
    section Deployment
    UAT & Go-Live      :a5, after a4, 2w
```
[View Timeline Diagram](https://mermaid.live/edit#pako:eNptkk1...)
"""
        elif diagram_type == "architecture":
            return """
```mermaid
graph TD
    A[User Interface] --> B[API Gateway]
    B --> C[Authentication Service]
    B --> D[Business Logic Layer]
    D --> E[Database Layer]
    D --> F[External APIs]
    E --> G[(Primary Database)]
    E --> H[(Cache Layer)]
```
[View Architecture Diagram](https://mermaid.live/edit#pako:eNptkk1...)
"""
        elif diagram_type == "modular":
            return """
```mermaid
graph LR
    Core[Core System] --> UserMgmt[User Management]
    Core --> DataProc[Data Processing]
    Core --> Reporting[Reporting Module]
    UserMgmt --> Auth[Authentication]
    UserMgmt --> Profile[Profile Management]
    DataProc --> Ingestion[Data Ingestion]
    DataProc --> Transform[Data Transformation]
    Reporting --> Dashboard[Dashboard]
    Reporting --> Analytics[Analytics Engine]
```
[View Modular Design](https://mermaid.live/edit#pako:eNptkk1...)
"""

# Example usage
if __name__ == "__main__":
    generator = MermaidDiagramGenerator()
    
    # Example timeline
    phases = [
        {"name": "Planning", "task": "Requirements", "start": "2024-01-01", "duration": "2w"},
        {"name": "Development", "task": "Core Build", "start": "2024-01-15", "duration": "6w"},
        {"name": "Testing", "task": "QA & UAT", "start": "2024-02-26", "duration": "2w"}
    ]
    
    timeline_url = generator.generate_timeline_diagram(phases, [])
    print(f"Timeline diagram: {timeline_url}")