


"use client";

import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Types
type ReadinessQuestion = {
  id: string;
  text: string;
  checked: boolean;
};

type ProjectMetadata = {
  projectNameEn: string;
  projectNameAr: string;
  clientNameEn: string;
  clientNameAr: string;
  projectType: string;
  boqType: string;
  numDeliverables: number;
  startDate: string;
  endDate: string;
  rfpCode: string;
};

// type Deliverable = {
//   name: string;
//   dueDate: string;
//   amount: number;
//   salaries: number;
//   tools: number;
//   others: number;
// };

type Deliverable = {
  name: string;
  dueDate: string;
  serviceId?: string;  // Add this line
  amount: number;
  salaries: number;
  tools: number;
  others: number;
  isManual?: boolean;  // Add this line to track manual entries
};

// type Service = {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   duration: number;
//   unit: string;
// };

type PaymentTerm = {
  description: string;
  percentage: number;
};

// type ProposalItem = {
//   description: string;
//   quantity: number;
//   unitPrice: number;
//   totalPrice: number;
// };

type ProposalItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
    unit_price: number;  
  total_price: number; 
};

type ProposalData = {
  offerNumber: string;
  date: string;
  currency: string;
  items: ProposalItem[];
  paymentTerms: PaymentTerm[];
  totalAmount: number;
};

type FinancialSummary = {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
};

type ReadinessResult = {
  score: number;
  status: string;
  message: string;
  canProceed: boolean;
};

const MutawaziProposalSystem = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [readinessQuestions, setReadinessQuestions] = useState<ReadinessQuestion[]>([]);
  const [projectData, setProjectData] = useState<ProjectMetadata>({
    projectNameEn: '',
    projectNameAr: '',
    clientNameEn: '',
    clientNameAr: '',
    projectType: '',
    boqType: '',
    numDeliverables: 1,
    startDate: '',
    endDate: '',
    rfpCode: ''
  });
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([
    { description: 'Project Initiation', percentage: 30 },
    { description: 'Mid-project Milestone', percentage: 40 },
    { description: 'Final Delivery', percentage: 30 }
  ]);
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [readinessResult, setReadinessResult] = useState<ReadinessResult | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({ 
    revenue: 0, 
    costs: 0, 
    profit: 0, 
    margin: 0 
  });
  const [paymentValidation, setPaymentValidation] = useState({ message: '', isValid: false });
  const [alerts, setAlerts] = useState<{id: number, message: string, type: string}[]>([]);

// Add these new state variables after your existing state declarations
const [servicesData, setServicesData] = useState<any[]>([]);
const [aiJustifications, setAiJustifications] = useState<{[key: string]: string}>({});
const [loadingAi, setLoadingAi] = useState<{[key: string]: boolean}>({});


  // Refs
  const finalProposalRef = useRef<HTMLDivElement>(null);
  let alertId = 0;

  // API configuration
  // const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api';
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL_FINANCE

  // Initialize readiness questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/readiness/questions`);
        const data = await response.json();
        
        const questions = data.questions.map((text: string, idx: number) => ({
          id: `q${idx}`,
          text,
          checked: false
        }));
        
        setReadinessQuestions(questions);
        showAlert('Questions loaded successfully', 'success');
      } catch (error) {
        console.error('Failed to load questions:', error);
        showAlert('Failed to load readiness questions', 'danger');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuestions();
  }, [API_BASE]);



  // Load services catalog
useEffect(() => {
  const loadServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/services`);
      const data = await response.json();
      
      // Convert services object to array for dropdown
      const servicesArray = Object.entries(data.services).map(([id, service]: [string, any]) => ({
        id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        unit: service.unit
      }));
      
      setServicesData(servicesArray);
    } catch (error) {
      console.error('Failed to load services:', error);
      showAlert('Failed to load services catalog', 'warning');
    }
  };
  
  loadServices();
}, [API_BASE]);



  // Initialize deliverables when number changes
  useEffect(() => {
    if (projectData.numDeliverables > 0) {
      const newDeliverables = Array(projectData.numDeliverables).fill(null).map(() => ({
        name: '',
        dueDate: '',
        amount: 0,
        salaries: 0,
        tools: 0,
        others: 0
      }));
      setDeliverables(newDeliverables);
    }
  }, [projectData.numDeliverables]);

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const previousStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  // Show alerts
  const showAlert = (message: string, type: string) => {
    const id = alertId++;
    setAlerts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  // Readiness assessment
  const assessReadiness = async () => {
    const score = readinessQuestions.filter(q => q.checked).length;
    const canProceed = score >= 6;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/readiness/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: readinessQuestions.map(q => q.checked) 
        })
      });
      
      const result = await response.json();
      
      setReadinessResult({
        score: result.score,
        status: result.status,
        message: result.message,
        canProceed: result.can_proceed
      });
      
      if (result.can_proceed) {
        showAlert('Readiness check passed!', 'success');
        setTimeout(nextStep, 1500);
      } else {
        showAlert('Please address the missing items', 'warning');
      }
    } catch (error) {
      console.error('Readiness assessment failed:', error);
      showAlert('Failed to assess readiness', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle metadata submission
  const submitMetadata = async () => {
    // Basic validation
    if (!projectData.projectNameEn || !projectData.projectNameAr || 
        !projectData.clientNameEn || !projectData.clientNameAr || 
        !projectData.projectType || !projectData.boqType || 
        !projectData.rfpCode || !projectData.startDate || !projectData.endDate) {
      showAlert('Please fill all required fields', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name_en: projectData.projectNameEn,
          project_name_ar: projectData.projectNameAr,
          client_name_en: projectData.clientNameEn,
          client_name_ar: projectData.clientNameAr,
          project_type: projectData.projectType,
          boq_type: projectData.boqType,
          num_deliverables: projectData.numDeliverables,
          rfp_code: projectData.rfpCode,
          start_date: projectData.startDate,
          end_date: projectData.endDate
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showAlert(`Project created! Quotation Code: ${result.quotation_code}`, 'success');
        nextStep();
      } else {
        showAlert('Failed to create project', 'danger');
      }
    } catch (error) {
      console.error('Project creation failed:', error);
      showAlert('Failed to create project', 'danger');
    } finally {
      setIsLoading(false);
    }
  };



//   AI FUNCTION

// Generate AI price justification
const generateAiJustification = async (serviceId: string, proposedPrice: number) => {
  setLoadingAi(prev => ({...prev, [serviceId]: true}));
  
  try {
    const response = await fetch(`${API_BASE}/price_justification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        proposed_price: proposedPrice
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setAiJustifications(prev => ({
        ...prev,
        [serviceId]: data.justification
      }));
      showAlert('AI justification generated!', 'success');
    } else {
      throw new Error(data.detail || 'Failed to generate justification');
    }
  } catch (error: any) {
    console.error('AI justification failed:', error);
    showAlert(error.message || 'Failed to generate AI justification', 'danger');
  } finally {
    setLoadingAi(prev => ({...prev, [serviceId]: false}));
  }
};

  // Calculate financial summary
  const calculateFinancialSummary = () => {
    let revenue = 0;
    let costs = 0;

    deliverables.forEach(deliv => {
      const baseCosts = deliv.salaries + deliv.tools + deliv.others;
      const overhead = baseCosts * 0.15;
      revenue += deliv.amount;
      costs += baseCosts + overhead;
    });

    const profit = revenue - costs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    setFinancialSummary({ revenue, costs, profit, margin });
  };

  // Handle deliverable changes
//   const updateDeliverable = (index: number, field: keyof Deliverable, value: string | number) => {
//     const newDeliverables = [...deliverables];
//     newDeliverables[index] = { ...newDeliverables[index], [field]: value };
//     setDeliverables(newDeliverables);
//     calculateFinancialSummary();
//   };


// Handle deliverable changes with service catalog integration
const updateDeliverable = (index: number, field: keyof Deliverable, value: string | number) => {
  const newDeliverables = [...deliverables];
  
  if (field === 'serviceId') {
    // Handle service selection
    if (value === 'manual' || value === '') {
      // Manual entry
      newDeliverables[index] = { 
        ...newDeliverables[index], 
        serviceId: undefined,
        isManual: true,
        name: '',
        amount: 0
      };
    } else {
      // Service catalog selection
      const selectedService = servicesData.find(s => s.id === value);
      if (selectedService) {
        newDeliverables[index] = { 
          ...newDeliverables[index], 
          serviceId: value as string,
          name: selectedService.name,
          amount: selectedService.price,
          isManual: false
        };
      }
    }
  } else {
    newDeliverables[index] = { ...newDeliverables[index], [field]: value };
  }
  
  setDeliverables(newDeliverables);
  calculateFinancialSummary();
};



  // Handle payment term changes
  const updatePaymentTerm = (index: number, field: keyof PaymentTerm, value: string) => {
    const newTerms = [...paymentTerms];
    newTerms[index] = { 
      ...newTerms[index], 
      [field]: field === 'percentage' ? parseFloat(value) || 0 : value 
    };
    setPaymentTerms(newTerms);
    validatePaymentTerms(newTerms);
  };

  // Validate payment terms
  const validatePaymentTerms = (terms: PaymentTerm[]) => {
    const total = terms.reduce((sum, term) => sum + term.percentage, 0);
    const isValid = Math.abs(total - 100) < 0.01;
    
    setPaymentValidation({
      message: isValid 
        ? 'Payment terms are valid (100%)' 
        : `Payment terms must total 100%. Current total: ${total.toFixed(1)}%`,
      isValid
    });
    
    return isValid;
  };

  // Generate proposal
  const generateProposal = async () => {
    if (!validatePaymentTerms(paymentTerms)) {
      showAlert('Please fix payment terms before generating proposal', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare deliverables data
    //   const deliverableData = deliverables.map(d => ({
    //     name: d.name,
    //     due_date: d.dueDate,
    //     amount: d.amount,
    //     salaries: d.salaries,
    //     tools: d.tools,
    //     others: d.others
    //   }));


    // In the generateProposal function, update the deliverableData mapping:
const deliverableData = deliverables.map(d => ({
  name: d.name,
  due_date: d.dueDate,
  service_id: d.serviceId || null,  // Add this line
  amount: d.amount,
  salaries: d.salaries,
  tools: d.tools,
  others: d.others
}));

      
      // Calculate cash flow
      const cashflowResponse = await fetch(`${API_BASE}/cashflow/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverables: deliverableData })
      });
      
      const cashflowResult = await cashflowResponse.json();
      
      if (!cashflowResponse.ok) {
        throw new Error(cashflowResult.message || 'Cash flow calculation failed');
      }
      
      // Generate proposal
      const proposalItems = cashflowResult.deliverables.map((d: any) => ({
        description: d.deliverable_name,
        quantity: 1,
        unit_price: d.cash_in,
        total_price: d.cash_in
      }));
      
      const proposalResponse = await fetch(`${API_BASE}/proposal/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_items: proposalItems,
          payment_terms: paymentTerms
        })
      });
      
      const proposalResult = await proposalResponse.json();
      
      if (!proposalResponse.ok) {
        throw new Error(proposalResult.message || 'Proposal generation failed');
      }
      
      // Set proposal data
      setProposalData({
        offerNumber: proposalResult.proposal.offer_number,
        date: proposalResult.proposal.date,
        currency: proposalResult.proposal.currency,
        items: proposalResult.proposal.items,
        paymentTerms: proposalResult.proposal.payment_terms.map((t: any) => ({
          description: t.description,
          percentage: t.percentage,
          amount: t.amount
        })),
        totalAmount: proposalResult.proposal.total_amount
      });
      
      showAlert('Proposal generated successfully!', 'success');
      nextStep();
    } catch (error: any) {
      console.error('Proposal generation failed:', error);
      showAlert(error.message || 'Failed to generate proposal', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Download CSV
  const downloadCSV = () => {
    if (!proposalData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "MUTAWAZI FINANCIAL PROPOSAL\n\n";
    csvContent += `Offer Number,${proposalData.offerNumber}\n`;
    csvContent += `Date,${proposalData.date}\n`;
    csvContent += `Currency,${proposalData.currency}\n\n`;
    csvContent += "Deliverables\nDescription,Quantity,Unit Price,Total\n";
    
    proposalData.items.forEach(item => {
      csvContent += `${item.description},${item.quantity},${item.unitPrice},${item.totalPrice}\n`;
    });
    
    csvContent += `\nTotal,${proposalData.totalAmount}\n\n`;
    csvContent += "Payment Schedule\nDescription,Percentage,Amount\n";
    
    proposalData.paymentTerms.forEach(term => {
      csvContent += `${term.description},${term.percentage}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mutawazi_proposal_${proposalData.offerNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('CSV downloaded successfully!', 'success');
  };

  // Save as PDF
  const savePDF = async () => {
    if (!finalProposalRef.current || !proposalData) return;
    
    setIsLoading(true);
    try {
      const canvas = await html2canvas(finalProposalRef.current, {
        window: {
          scrollX: 0,
          scrollY: 0,
          width: finalProposalRef.current.offsetWidth,
          height: finalProposalRef.current.offsetHeight,
        },
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF"
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'px', [canvas.width, canvas.height]);
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`mutawazi_proposal_${proposalData.offerNumber}.pdf`);
      
      showAlert('PDF saved successfully!', 'success');
    } catch (error) {
      console.error('PDF generation failed:', error);
      showAlert('Failed to generate PDF', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Add payment term
  const addPaymentTerm = () => {
    setPaymentTerms([...paymentTerms, { description: 'New Payment', percentage: 0 }]);
  };

  // Remove payment term
  const removePaymentTerm = (index: number) => {
    if (paymentTerms.length > 1) {
      const newTerms = [...paymentTerms];
      newTerms.splice(index, 1);
      setPaymentTerms(newTerms);
      validatePaymentTerms(newTerms);
    }
  };

  // Render functions for each step
  const renderStep1 = () => (
    <div className={`${currentStep === 1 ? 'block' : 'hidden'} animate-fadeIn`}>
      <div className="flex items-center mb-8 pb-4 border-b border-gray-700">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-tan text-dark-green text-xl font-bold mr-5">
          1
        </div>
        <h2 className="text-2xl text-white font-light">Readiness Assessment</h2>
      </div>

      <div className="bg-accent-tan/10 border border-accent-tan/30 rounded-xl p-5 mb-6 text-gray-300">
        <strong className="font-semibold">Before proceeding,</strong> please answer the following questions honestly. 
        You need a minimum score of 6/7 to continue with the proposal creation.
      </div>

      <div className="space-y-4 mb-8">
        {readinessQuestions.map((question) => (
          <div 
            key={question.id}
            className={`flex items-center p-4 rounded-xl transition-all cursor-pointer border-2 ${
              question.checked 
                ? 'bg-accent-tan/20 border-accent-tan' 
                : 'bg-dark-green border-gray-700 hover:bg-charcoal'
            }`}
            onClick={() => {
              const updated = readinessQuestions.map(q => 
                q.id === question.id ? {...q, checked: !q.checked} : q
              );
              setReadinessQuestions(updated);
            }}
          >
            <input 
              type="checkbox" 
              id={question.id}
              checked={question.checked}
              onChange={() => {}}
              className="w-5 h-5 text-accent-tan rounded focus:ring-accent-tan mr-4"
            />
            <label htmlFor={question.id} className="text-gray-300 cursor-pointer">
              {question.text}
            </label>
          </div>
        ))}
      </div>

      {readinessResult && (
        <div className={`rounded-2xl p-6 text-center mb-6 ${
          readinessResult.canProceed
            ? readinessResult.score === 7
              ? 'bg-gradient-to-br from-accent-tan/20 to-accent-tan/10 border border-accent-tan/30'
              : 'bg-gradient-to-br from-accent-tan/15 to-accent-tan/5 border border-accent-tan/20'
            : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
        }`}>
          <h3 className="text-xl font-bold mb-2 text-white">
            Score: {readinessResult.score}/7 - {readinessResult.status}
          </h3>
          <p className="text-gray-300">{readinessResult.message}</p>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <button 
          onClick={assessReadiness}
          className="bg-accent-tan hover:bg-accent-tan-hover text-dark-green py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Check Readiness
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={`${currentStep === 2 ? 'block' : 'hidden'} animate-fadeIn`}>
      <div className="flex items-center mb-8 pb-4 border-b border-gray-700">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-tan text-dark-green text-xl font-bold mr-5">
          2
        </div>
        <h2 className="text-2xl text-white font-light">Project Information</h2>
      </div>

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Project Name (English) *
            </label>
            <input
              type="text"
              required
              value={projectData.projectNameEn}
              onChange={(e) => setProjectData({...projectData, projectNameEn: e.target.value})}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Project Name (Arabic) *
            </label>
            <input
              type="text"
              required
              value={projectData.projectNameAr}
              onChange={(e) => setProjectData({...projectData, projectNameAr: e.target.value})}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Client Name (English) *
            </label>
            <input
              type="text"
              required
              value={projectData.clientNameEn}
              onChange={(e) => setProjectData({...projectData, clientNameEn: e.target.value})}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Client Name (Arabic) *
            </label>
            <input
              type="text"
              required
              value={projectData.clientNameAr}
              onChange={(e) => setProjectData({...projectData, clientNameAr: e.target.value})}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Project Type *
            </label>
            <select
              required
              value={projectData.projectType}
              onChange={(e) => setProjectData({...projectData, projectType: e.target.value})}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            >
              <option value="">Select Project Type</option>
              <option value="fixed">Fixed-scope or Training Delivery</option>
              <option value="framework">Framework</option>
              <option value="deliverable">Application / Platform Development</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              BOQ Type *
            </label>
            <select
              required
              value={projectData.boqType}
              onChange={(e) => setProjectData({...projectData, boqType: e.target.value})}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            >
              <option value="">Select BOQ Type</option>
              <option value="deliverable-based">Deliverable-based</option>
              <option value="monthly resources-based">Monthly Resources-based</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Number of Deliverables *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={projectData.numDeliverables}
              onChange={(e) => setProjectData({...projectData, numDeliverables: parseInt(e.target.value) || 1})}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              RFP Code *
            </label>
            <input
              type="text"
              required
              value={projectData.rfpCode}
              onChange={(e) => setProjectData({...projectData, rfpCode: e.target.value})}
              placeholder="e.g., RFP-2024-001"
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={projectData.startDate}
              onChange={(e) => setProjectData({...projectData, startDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              End Date *
            </label>
            <input
              type="date"
              required
              value={projectData.endDate}
              onChange={(e) => setProjectData({...projectData, endDate: e.target.value})}
              min={projectData.startDate || new Date().toISOString().split('T')[0]}
              className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
            />
          </div>
        </div>
      </form>

      <div className="flex justify-center gap-4 mt-10">
        <button 
          onClick={previousStep}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Previous
        </button>
        <button 
          onClick={submitMetadata}
          className="bg-accent-tan hover:bg-accent-tan-hover text-dark-green py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={`${currentStep === 3 ? 'block' : 'hidden'} animate-fadeIn`}>
      <div className="flex items-center mb-8 pb-4 border-b border-gray-700">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-tan text-dark-green text-xl font-bold mr-5">
          3
        </div>
        <h2 className="text-2xl text-white font-light">Deliverables & Cost Planning</h2>
      </div>

      <div className="bg-accent-tan/10 border border-accent-tan/30 rounded-xl p-5 mb-8 text-gray-300">
        <strong className="font-semibold">Important:</strong> For each deliverable, specify how much you'll charge the client and your estimated costs. 
        The system will automatically calculate overhead (15%) and profit/loss.
      </div>

      <div className="space-y-6">
        {/* {deliverables.map((deliverable, index) => {
          const baseCosts = deliverable.salaries + deliverable.tools + deliverable.others;
          const overhead = baseCosts * 0.15;
          const totalCosts = baseCosts + overhead;
          const profit = deliverable.amount - totalCosts;
          const margin = deliverable.amount > 0 ? (profit / deliverable.amount) * 100 : 0;
          
          return (
            <div key={index} className="bg-charcoal border border-gray-700 rounded-2xl p-6 transition-all hover:border-accent-tan hover:shadow-md">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-tan text-dark-green font-bold">
                  {index + 1}
                </div>
                {deliverable.amount > 0 && (
                  <div className={`py-2 px-4 rounded-full font-semibold text-sm ${
                    profit > 0 
                      ? 'bg-green-100 text-green-800' 
                      : profit < 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profit > 0 ? '✅ Profitable' : profit < 0 ? '❌ Loss' : 'Neutral'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Deliverable Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliverable.name}
                    onChange={(e) => updateDeliverable(index, 'name', e.target.value)}
                    placeholder="e.g., AI Strategy Development"
                    className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliverable.dueDate}
                    onChange={(e) => updateDeliverable(index, 'dueDate', e.target.value)}
                    className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Amount to Charge Client (SAR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={deliverable.amount || ''}
                    onChange={(e) => updateDeliverable(index, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="200000"
                    className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Salary Costs (SAR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={deliverable.salaries || ''}
                    onChange={(e) => updateDeliverable(index, 'salaries', parseFloat(e.target.value) || 0)}
                    placeholder="120000"
                    className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Tools/Software Costs (SAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={deliverable.tools || ''}
                    onChange={(e) => updateDeliverable(index, 'tools', parseFloat(e.target.value) || 0)}
                    placeholder="30000"
                    className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Other Expenses (SAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={deliverable.others || ''}
                    onChange={(e) => updateDeliverable(index, 'others', parseFloat(e.target.value) || 0)}
                    placeholder="20000"
                    className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
                  />
                </div>
              </div>

              {(deliverable.amount > 0 || baseCosts > 0) && (
                <div className="bg-dark-green rounded-xl p-5 mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-400">Revenue</p>
                      <p className="font-bold text-lg text-green-400">{deliverable.amount.toLocaleString()} SAR</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Costs (incl. overhead)</p>
                      <p className="font-bold text-lg text-red-400">{totalCosts.toLocaleString()} SAR</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Profit/Loss</p>
                      <p className={`font-bold text-lg ${
                        profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {profit.toLocaleString()} SAR
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Margin</p>
                      <p className={`font-bold text-lg ${
                        margin > 0 ? 'text-green-400' : margin < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })} */}


{deliverables.map((deliverable, index) => {
  const baseCosts = deliverable.salaries + deliverable.tools + deliverable.others;
  const overhead = baseCosts * 0.15;
  const totalCosts = baseCosts + overhead;
  const profit = deliverable.amount - totalCosts;
  const margin = deliverable.amount > 0 ? (profit / deliverable.amount) * 100 : 0;
  const selectedService = deliverable.serviceId ? servicesData.find(s => s.id === deliverable.serviceId) : null;
  
  return (
    <div key={index} className="bg-charcoal border border-gray-700 rounded-2xl p-6 transition-all hover:border-accent-tan hover:shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-tan text-dark-green font-bold">
          {index + 1}
        </div>
        {deliverable.amount > 0 && (
          <div className={`py-2 px-4 rounded-full font-semibold text-sm ${
            profit > 0 
              ? 'bg-green-100 text-green-800' 
              : profit < 0 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-800'
          }`}>
            {profit > 0 ? '✅ Profitable' : profit < 0 ? '❌ Loss' : 'Neutral'}
          </div>
        )}
      </div>

      {/* Service Catalog Dropdown */}
      <div className="mb-6">
        <label className="block text-gray-300 font-semibold mb-2">
          Service Catalog *
        </label>
        <select
          value={deliverable.serviceId || 'manual'}
          onChange={(e) => updateDeliverable(index, 'serviceId', e.target.value)}
          className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
        >
          <option value="manual">Manual Entry (Custom Service)</option>
          {servicesData.map(service => (
            <option key={service.id} value={service.id}>
              {service.name} - {service.price.toLocaleString()} SAR ({service.duration}m)
            </option>
          ))}
        </select>
      </div>

      {/* Service Details Display */}
      {selectedService && (
        <div className="bg-accent-tan/10 border border-accent-tan/30 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Service Duration</p>
              <p className="font-semibold text-white">{selectedService.duration} months</p>
            </div>
            <div>
              <p className="text-gray-400">Catalog Price</p>
              <p className="font-semibold text-accent-tan">{selectedService.price.toLocaleString()} SAR</p>
            </div>
            <div>
              <p className="text-gray-400">Unit Type</p>
              <p className="font-semibold text-white">{selectedService.unit}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-gray-400 text-sm">Description:</p>
            <p className="text-gray-300 text-sm">{selectedService.description}</p>
          </div>
          
          {/* AI Justification Button */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => generateAiJustification(selectedService.id, deliverable.amount)}
              disabled={loadingAi[selectedService.id]}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded-lg font-medium text-sm transition-all hover:scale-105"
            >
              {loadingAi[selectedService.id] ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </span>
              ) : (
                '🤖 Generate AI Price Justification'
              )}
            </button>
          </div>
          
          {/* AI Justification Display */}
          {aiJustifications[selectedService.id] && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800 font-medium mb-2">AI Price Analysis:</p>
              <p className="text-purple-700 text-sm leading-relaxed">
                {aiJustifications[selectedService.id]}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">
            Deliverable Name *
          </label>
          <input
            type="text"
            required
            value={deliverable.name}
            onChange={(e) => updateDeliverable(index, 'name', e.target.value)}
            disabled={!deliverable.isManual && selectedService}
            placeholder="e.g., AI Strategy Development"
            className={`w-full p-4 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-accent-tan/30 transition-all text-white ${
              !deliverable.isManual && selectedService 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-dark-green focus:bg-charcoal focus:border-accent-tan'
            }`}
          />
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">
            Due Date *
          </label>
          <input
            type="date"
            required
            value={deliverable.dueDate}
            onChange={(e) => updateDeliverable(index, 'dueDate', e.target.value)}
            className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">
            Amount to Charge Client (SAR) *
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            required
            value={deliverable.amount || ''}
            onChange={(e) => updateDeliverable(index, 'amount', parseFloat(e.target.value) || 0)}
            disabled={!deliverable.isManual && selectedService}
            placeholder="200000"
            className={`w-full p-4 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-accent-tan/30 transition-all text-white ${
              !deliverable.isManual && selectedService 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-dark-green focus:bg-charcoal focus:border-accent-tan'
            }`}
          />
          {!deliverable.isManual && selectedService && (
            <p className="text-xs text-gray-400 mt-1">Price auto-filled from catalog service</p>
          )}
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">
            Salary Costs (SAR) *
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            required
            value={deliverable.salaries || ''}
            onChange={(e) => updateDeliverable(index, 'salaries', parseFloat(e.target.value) || 0)}
            placeholder="120000"
            className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">
            Tools/Software Costs (SAR)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={deliverable.tools || ''}
            onChange={(e) => updateDeliverable(index, 'tools', parseFloat(e.target.value) || 0)}
            placeholder="30000"
            className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">
            Other Expenses (SAR)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={deliverable.others || ''}
            onChange={(e) => updateDeliverable(index, 'others', parseFloat(e.target.value) || 0)}
            placeholder="20000"
            className="w-full p-4 border-2 border-gray-700 rounded-xl bg-dark-green focus:bg-charcoal focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
          />
        </div>
      </div>

      {(deliverable.amount > 0 || baseCosts > 0) && (
        <div className="bg-dark-green rounded-xl p-5 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-400">Revenue</p>
              <p className="font-bold text-lg text-green-400">{deliverable.amount.toLocaleString()} SAR</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Costs (incl. overhead)</p>
              <p className="font-bold text-lg text-red-400">{totalCosts.toLocaleString()} SAR</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Profit/Loss</p>
              <p className={`font-bold text-lg ${
                profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {profit.toLocaleString()} SAR
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Margin</p>
              <p className={`font-bold text-lg ${
                margin > 0 ? 'text-green-400' : margin < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {margin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
})}



      </div>

      {financialSummary.revenue > 0 && (
        <div className="bg-accent-tan/10 border border-accent-tan/30 rounded-2xl p-6 mt-8">
          <h3 className="text-xl font-bold text-center mb-4 text-white">Project Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <h4 className="text-sm text-gray-400 mb-1">Total Revenue</h4>
              <div className="text-2xl font-bold text-white">{financialSummary.revenue.toLocaleString()} SAR</div>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-1">Total Costs</h4>
              <div className="text-2xl font-bold text-white">{financialSummary.costs.toLocaleString()} SAR</div>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-1">Total Profit</h4>
              <div className={`text-2xl font-bold ${
                financialSummary.profit > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {financialSummary.profit.toLocaleString()} SAR
              </div>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-1">Profit Margin</h4>
              <div className={`text-2xl font-bold ${
                financialSummary.margin > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {financialSummary.margin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 mt-10">
        <button 
          onClick={previousStep}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Previous
        </button>
        <button 
          onClick={nextStep}
          className="bg-accent-tan hover:bg-accent-tan-hover text-dark-green py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Calculate & Continue
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className={`${currentStep === 4 ? 'block' : 'hidden'} animate-fadeIn`}>
      <div className="flex items-center mb-8 pb-4 border-b border-gray-700">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-tan text-dark-green text-xl font-bold mr-5">
          4
        </div>
        <h2 className="text-2xl text-white font-light">Payment Terms</h2>
      </div>

      <div className="bg-accent-tan/10 border border-accent-tan/30 rounded-xl p-5 mb-6 text-gray-300">
        <strong className="font-semibold">Payment Schedule:</strong> Define how payments will be distributed throughout the project. Total must equal 100%.
      </div>

      <div className="space-y-6">
        {paymentTerms.map((term, index) => (
          <div key={index} className="bg-dark-green border border-gray-700 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Payment Description
                </label>
                <input
                  type="text"
                  value={term.description}
                  onChange={(e) => updatePaymentTerm(index, 'description', e.target.value)}
                  className="w-full p-4 border-2 border-gray-700 rounded-xl bg-charcoal focus:bg-dark-green focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={term.percentage}
                  onChange={(e) => updatePaymentTerm(index, 'percentage', e.target.value)}
                  className="w-full p-4 border-2 border-gray-700 rounded-xl bg-charcoal focus:bg-dark-green focus:border-accent-tan focus:ring-2 focus:ring-accent-tan/30 transition-all text-white"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => removePaymentTerm(index)}
                className="bg-gray-600 text-gray-300 py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button 
          onClick={addPaymentTerm}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold text-md uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          + Add Payment Term
        </button>
      </div>

      {paymentValidation.message && (
        <div className={`rounded-xl p-4 mt-6 ${
          paymentValidation.isValid 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          {paymentValidation.message}
        </div>
      )}

      <div className="flex justify-center gap-4 mt-10">
        <button 
          onClick={previousStep}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Previous
        </button>
        <button 
          onClick={generateProposal}
          className="bg-accent-tan hover:bg-accent-tan-hover text-dark-green py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Generate Proposal
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className={`${currentStep === 5 ? 'block' : 'hidden'} animate-fadeIn`}>
      <div className="flex items-center mb-8 pb-4 border-b border-gray-700">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-tan text-dark-green text-xl font-bold mr-5">
          5
        </div>
        <h2 className="text-2xl text-white font-light">Final Proposal</h2>
      </div>

      <div 
        ref={finalProposalRef} 
        className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg"
      >
        {proposalData ? (
          <>
            <div className="text-center mb-10 pb-6 border-b border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">MUTAWAZI</div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Financial Proposal</h1>
              <p className="text-gray-600">Professional AI Consulting Services</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Project Information</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Project:</strong> {projectData.projectNameEn}</p>
                  <p><strong>Client:</strong> {projectData.clientNameEn}</p>
                  <p><strong>Start Date:</strong> {projectData.startDate}</p>
                  <p><strong>End Date:</strong> {projectData.endDate}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Proposal Details</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Offer Number:</strong> {proposalData.offerNumber}</p>
                  <p><strong>RFP Code:</strong> {projectData.rfpCode}</p>
                  <p><strong>Date:</strong> {proposalData.date}</p>
                  <p><strong>Currency:</strong> {proposalData.currency}</p>
                </div>
              </div>
            </div>
            
            {/* <div className="mb-10">
              <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-900">Project Deliverables</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 text-gray-700">Item</th>
                    <th className="text-left p-3 text-gray-700">Description</th>
                    <th className="text-left p-3 text-gray-700">Quantity</th>
                    <th className="text-left p-3 text-gray-700">Unit Price (SAR)</th>
                    <th className="text-left p-3 text-gray-700">Total (SAR)</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-3 text-gray-700">{index + 1}</td>
                      <td className="p-3 text-gray-700">{item.description}</td>
                      <td className="p-3 text-gray-700">{item.quantity}</td>
                      <td className="p-3 text-gray-700">{item.unitPrice !== undefined ? item.unitPrice.toLocaleString() : ''}</td>
                      <td className="p-3 text-gray-700">{item.totalPrice !== undefined ? item.totalPrice.toLocaleString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div> */}

            <div className="mb-10">
  <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-900">Project Deliverables</h3>
  <table className="w-full">
    <thead>
      <tr className="bg-gray-50">
        <th className="text-left p-3 text-gray-700">Item</th>
        <th className="text-left p-3 text-gray-700">Description</th>
        <th className="text-left p-3 text-gray-700">Quantity</th>
        <th className="text-left p-3 text-gray-700">Unit Price (SAR)</th>
        <th className="text-left p-3 text-gray-700">Total (SAR)</th>
      </tr>
    </thead>
    <tbody>
      {proposalData.items.map((item, index) => (
        <tr key={index} className="border-b border-gray-100">
          <td className="p-3 text-gray-700">{index + 1}</td>
          <td className="p-3 text-gray-700">{item.description}</td>
          <td className="p-3 text-gray-700">{item.quantity || 1}</td>
           <td className="p-3 text-gray-700">
            {(item.unit_price || item.unitPrice || item.total_price || item.totalPrice || 0).toLocaleString()}
          </td>
          <td className="p-3 text-gray-700">
            {(item.total_price || item.totalPrice || item.unit_price || item.unitPrice || 0).toLocaleString()}
          </td> 



        </tr>
      ))}
    </tbody>
  </table>
</div>
            
            <div className="bg-blue-600 text-white rounded-xl p-6 text-center mb-10">
              <h2 className="text-2xl font-bold">Total Project Value: {proposalData.totalAmount.toLocaleString()} SAR</h2>
            </div>
            
            <div className="mb-10">
              <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-900">Payment Schedule</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 text-gray-700">Payment</th>
                    <th className="text-left p-3 text-gray-700">Description</th>
                    <th className="text-left p-3 text-gray-700">Percentage</th>
                    <th className="text-left p-3 text-gray-700">Amount (SAR)</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalData.paymentTerms.map((term, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-3 text-gray-700">{index + 1}</td>
                      <td className="p-3 text-gray-700">{term.description}</td>
                      <td className="p-3 text-gray-700">{term.percentage}%</td>
                      <td className="p-3 text-gray-700">{(proposalData.totalAmount * term.percentage / 100).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-900">Terms & Conditions</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>All prices are in Saudi Arabian Riyals (SAR)</li>
                <li>Payment terms as specified in the payment schedule</li>
                <li>Project timeline: From {projectData.startDate} to {projectData.endDate}</li>
                <li>This proposal is valid for 30 days from the date of issue</li>
                <li>Additional work outside the scope will be quoted separately</li>
              </ul>
            </div>
          </>
        ) : (
          <p className="text-gray-700">Loading proposal data...</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-10">
        <button 
          onClick={previousStep}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Previous
        </button>
        <button 
          onClick={downloadCSV}
          className="bg-accent-tan hover:bg-accent-tan-hover text-dark-green py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Download CSV Quotation
        </button>
        <button 
          onClick={savePDF}
          className="bg-accent-tan hover:bg-accent-tan-hover text-dark-green py-3 px-8 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all hover:scale-105 hover:shadow-lg"
        >
          Save as PDF
        </button>
      </div>
    </div>
  );

  // Main component render
  return (
    <div className="min-h-screen bg-dark-green p-5">
      {/* Floating alerts */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {alerts.map(alert => (
          <div 
            key={alert.id}
            className={`p-4 rounded-lg shadow-lg max-w-md ${
              alert.type === 'success' ? 'bg-green-600 text-white' :
              alert.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-red-600 text-white'
            }`}
          >
            {alert.message}
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto bg-charcoal rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-dark-green text-white py-8 px-6 text-center border-b border-gray-700">
          <h1 className="text-3xl md:text-4xl font-light mb-2">🏢 Mutawazi Financial Proposal System</h1>
          <p className="text-lg text-gray-300">Professional AI Consulting Proposal Generator</p>
        </div>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-8">
            <div 
              className="bg-accent-tan h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>

          {/* Steps */}
          {renderStep1()}
          {renderStep2()}
          {renderStep3()}
          {renderStep4()}
          {renderStep5()}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="text-center p-10 bg-charcoal border border-accent-tan/30 rounded-xl shadow-2xl">
                <div className="w-16 h-16 border-4 border-accent-tan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-xl">Processing your request...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MutawaziProposalSystem;



