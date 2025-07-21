import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { esgAPI } from '../../utils/api';
import { taskStorage } from '../../services/taskStorage';

interface ESGQuestion {
  id: number;
  question: string;
  rationale: string;
  frameworks: string;
  data_source: string;
  category: string;
  sector: string;
  required: boolean;
  type: 'yes_no' | 'number' | 'text' | 'date' | 'multiple_choice';
}

interface ESGScopingData {
  sector: string;
  total_questions: number;
  categories: string[];
  questions_by_category: Record<string, ESGQuestion[]>;
  frameworks: string[];
}

interface ESGScopingWizardProps {
  companyId: string;
  businessSector: string;
  onComplete: (results: any) => void;
  onBack?: () => void;
}

export default function ESGScopingWizard({ companyId, businessSector, onComplete, onBack }: ESGScopingWizardProps) {
  const navigate = useNavigate();
  // Add spinning animation
  const spinKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  // Inject styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = spinKeyframes;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    // Add some default test answers for development
    1: 'Test Company',
    2: '50',
    // You can add more default answers here for testing
  });
  const [preferences, setPreferences] = useState({
    priority_level: 'medium',
    completion_timeframe: '6_months'
  });
  const queryClient = useQueryClient();

  // Load existing ESG scoping answers when component mounts
  useEffect(() => {
    const loadExistingAnswers = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const companyId = currentUser.company_id;
        
        if (companyId) {
          console.log('Loading existing ESG scoping data for company:', companyId);
          
          // Try to get existing scoping status
          const response = await fetch(`http://localhost:8000/api/esg/scoping/${companyId}/status`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const scopingStatus = await response.json();
            console.log('Existing scoping status:', scopingStatus);
            
            // If scoping is completed, load the saved answers from backend
            if (scopingStatus.scoping_completed && scopingStatus.saved_answers) {
              console.log('Loading saved answers from backend:', scopingStatus.saved_answers);
              setAnswers(prevAnswers => ({
                ...prevAnswers,
                ...scopingStatus.saved_answers
              }));
              
              // Also update preferences if available
              if (scopingStatus.preferences) {
                setPreferences(scopingStatus.preferences);
              }
            } else {
              // Fallback to localStorage if backend doesn't have answers
              const savedAnswers = localStorage.getItem(`esg_scoping_answers_${companyId}`);
              if (savedAnswers) {
                const parsedAnswers = JSON.parse(savedAnswers);
                console.log('Loading saved answers from localStorage fallback:', parsedAnswers);
                setAnswers(prevAnswers => ({
                  ...prevAnswers,
                  ...parsedAnswers
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading existing ESG scoping data:', error);
      }
    };
    
    loadExistingAnswers();
  }, []);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    // Only save ESG-related answers, not the default test data
    const esgAnswers = { ...answers };
    delete esgAnswers[1]; // Remove company name
    delete esgAnswers[2]; // Remove employee count
    
    if (Object.keys(esgAnswers).length > 0) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = currentUser.company_id;
      if (companyId) {
        localStorage.setItem(`esg_scoping_answers_${companyId}`, JSON.stringify(esgAnswers));
        console.log('Saved ESG answers to localStorage for company:', companyId, esgAnswers);
      }
    }
  }, [answers]);

  // Comprehensive sector-specific ESG questions
  const getSectorQuestions = (sector: string) => {

    switch (sector.toLowerCase()) {
      case 'hospitality':
        return {
          environmental: [
            {
              id: 11,
              question: 'Do you track your total monthly electricity consumption from the public grid (e.g., DEWA) in kilowatt-hours (kWh)?',
              rationale: 'Scope 2 Emissions',
              frameworks: 'DST Carbon Calculator: Mandatory Input, Green Key: 7.1 Monthly energy registration (I)',
              data_source: 'Monthly utility bills',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 12,
              question: 'Do you use any fuel (like diesel or petrol) for on-site power generators?',
              rationale: 'Scope 1 Emissions',
              frameworks: 'DST Carbon Calculator: Mandatory Input (Petrol, Diesel)',
              data_source: 'Fuel purchase receipts/logs',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 13,
              question: 'Do you use district cooling services?',
              rationale: 'Scope 2 Emissions',
              frameworks: 'DST Carbon Calculator: Mandatory Input',
              data_source: 'Monthly district cooling bills',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 14,
              question: 'Do you use Liquefied Petroleum Gas (LPG) for cooking or heating?',
              rationale: 'Scope 1 Emissions',
              frameworks: 'DST Carbon Calculator: Mandatory Input',
              data_source: 'LPG purchase invoices/logs',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 15,
              question: 'Are at least 75% of your light bulbs energy-efficient models (like LED)?',
              rationale: 'Energy Efficiency',
              frameworks: 'Green Key: 7.3 Energy-efficient bulbs (I), DST: 2.1 Energy efficiency plan',
              data_source: 'Purchase invoices, lighting inventory',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 16,
              question: 'Do you track your total monthly water consumption in cubic meters (m³)?',
              rationale: 'Water Consumption',
              frameworks: 'DST Carbon Calculator: Mandatory Input, Green Key: 4.1 Monthly water registration (I)',
              data_source: 'Monthly water utility bills',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 17,
              question: 'Do the showers in your guest rooms have a flow rate of 9 litres per minute or less?',
              rationale: 'Water Efficiency',
              frameworks: 'Green Key: 4.4 Shower water flow (I), DST: 3.1 Water conservation plan',
              data_source: 'Technical specifications for showerheads',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 18,
              question: 'Do you measure the total amount of waste sent to landfill each month (in kg or tonnes)?',
              rationale: 'Waste to Landfill',
              frameworks: 'DST Carbon Calculator: Mandatory Input',
              data_source: 'Waste contractor invoices/reports',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 19,
              question: 'Do you separate waste for recycling (e.g., paper, plastic, glass) and track the amounts recycled?',
              rationale: 'Recycling Rate',
              frameworks: 'DST Carbon Calculator: Mandatory Input, Green Key: 6.1 Waste separation (I)',
              data_source: 'Waste contractor invoices/reports',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 20,
              question: 'Do you use bulk, refillable dispensers for toiletries (soap, shampoo) in guest bathrooms?',
              rationale: 'Plastic Waste Reduction',
              frameworks: 'Green Key: 6.11 Toiletries in dispensers (G), DST: 4.2 Reduce waste from toiletries',
              data_source: 'Photos of dispensers in bathrooms',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 25,
              question: 'Do you have a program that encourages guests to reuse their towels and linens?',
              rationale: 'Guest Engagement',
              frameworks: 'DST: 3.2 Reuse guest towels/linens, Green Key: 5.1 & 5.2 Guest information (I)',
              data_source: 'Photos of in-room signage',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 26,
              question: 'Do you provide regular training for all staff on your sustainability goals and their specific roles?',
              rationale: 'Employee Engagement',
              frameworks: 'DST: 1.4 Train employees, Green Key: 2.1 Staff training (I)',
              data_source: 'Training records, materials',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 30,
              question: 'Do you have a designated person or team responsible for your hotel\'s sustainability efforts?',
              rationale: 'Management Structure',
              frameworks: 'Green Key: 1.1 Environmental Manager (I), DST: 1.3 Establish a committee',
              data_source: 'Job description, Committee meeting minutes',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 31,
              question: 'Do you have a written sustainability policy signed by senior management?',
              rationale: 'Formal Commitment',
              frameworks: 'Green Key: 1.2 Sustainability Policy (I), DST: 1.3 (Implied foundation for committee)',
              data_source: 'Signed policy document',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 32,
              question: 'Do you have a policy to give preference to local, organic, or fair-trade suppliers?',
              rationale: 'Sustainable Procurement',
              frameworks: 'DST: 6.1 Sustainable purchasing plan, Green Key: 8.1 Purchase from sustainable categories (I)',
              data_source: 'Purchasing policy, sample invoices',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ]
        };

      case 'construction':
        return {
          environmental: [
            {
              id: 40,
              question: 'Are you pursuing a green building certification for this project (e.g., Al Sa\'fat, Estidama, LEED)?',
              rationale: 'Sustainable Design',
              frameworks: 'Al Sa\'fat: Mandatory for all new Dubai buildings, Estidama: Mandatory for all new Abu Dhabi buildings, LEED: Voluntary international standard',
              data_source: 'Project design brief, registration with certification body',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 41,
              question: 'Have you conducted an Environmental Impact Assessment (EIA) for this project?',
              rationale: 'Risk Assessment',
              frameworks: 'Dubai Municipality: Required for projects with potential environmental impact, JAFZA: Required for projects in the free zone',
              data_source: 'EIA Report',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 42,
              question: 'Does your building design incorporate features to reduce energy use, such as high-performance insulation or window glazing?',
              rationale: 'Passive Design & Energy Efficiency',
              frameworks: 'Al Sa\'fat / Dubai Regulations: Mandates high-performance insulation and lighting, Estidama (Resourceful Energy): Targets energy conservation',
              data_source: 'Building design specifications, material data sheets',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 43,
              question: 'Does the project plan include installing on-site renewable energy, like solar panels?',
              rationale: 'Renewable Energy Generation',
              frameworks: 'Dubai Clean Energy Strategy 2050: Aims for 75% clean energy, Al Sa\'fat / Estidama: Provide credits for renewable energy',
              data_source: 'Project plans, supplier contracts',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 44,
              question: 'Do you have a Construction and Demolition (C&D) Waste Management Plan in place?',
              rationale: 'Waste Management',
              frameworks: 'Federal Law No. 12 of 2018: Mandates waste management, Al Sa\'fat / Estidama: Mandatory credits for C&D waste management',
              data_source: 'C&D Waste Management Plan document',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 45,
              question: 'Do you segregate construction waste on-site for recycling (e.g., concrete, steel, wood)?',
              rationale: 'Waste Diversion',
              frameworks: 'Al Sa\'fat / Estidama: Credits for diverting waste from landfill, Dubai Municipality: Requires waste segregation',
              data_source: 'Waste transfer notes from recycling facilities',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 46,
              question: 'Do you use locally sourced or recycled materials in your construction?',
              rationale: 'Sustainable Materials',
              frameworks: 'Al Sa\'fat / Estidama (Stewarding Materials): Credits for using local and recycled content',
              data_source: 'Material procurement records, supplier certificates',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 47,
              question: 'Do you have measures to control dust and air pollution from the construction site?',
              rationale: 'Air Quality',
              frameworks: 'Dubai Municipality: Requires air quality monitoring and control',
              data_source: 'Air quality monitoring plan/reports',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 50,
              question: 'Does the building have separate meters to track electricity and water consumption for different areas (e.g., common areas, individual units)?',
              rationale: 'Sub-metering & Monitoring',
              frameworks: 'Al Sa\'fat / Estidama: Credits for energy and water metering',
              data_source: 'Building management system (BMS) specifications',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 51,
              question: 'Are water-efficient fixtures (low-flow taps, toilets) installed in the building?',
              rationale: 'Water Conservation',
              frameworks: 'Al Sa\'fat / Dubai Regulations: Mandates water-efficient fixtures, Estidama (Precious Water): Requires reduction in water demand',
              data_source: 'Fixture specification sheets',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 60,
              question: 'Does the building have dedicated recycling bins for tenants/occupants?',
              rationale: 'Occupant Waste Management',
              frameworks: 'Al Sa\'fat / Estidama: Credits for operational waste management',
              data_source: 'Photos of recycling facilities',
              category: 'governance',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ]
        };

      case 'manufacturing':
        return {
          environmental: [
            {
              id: 70,
              question: 'Do you have a certified Environmental Management System, such as ISO 14001?',
              rationale: 'Formalized System',
              frameworks: 'ISO 14001: A voluntary but widely recognized standard for EMS',
              data_source: 'ISO 14001 Certificate',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 71,
              question: 'Have you conducted an Environmental Impact Assessment (EIA) for your facility?',
              rationale: 'Risk Assessment',
              frameworks: 'Dubai Municipality: Required for industrial projects',
              data_source: 'EIA Report',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 72,
              question: 'Do you track your facility\'s monthly consumption of all energy sources (electricity, natural gas, diesel)?',
              rationale: 'Scope 1 & 2 Emissions',
              frameworks: 'Federal Energy Management Regulation: Mandates energy management, Climate Law: Requires GHG reporting',
              data_source: 'Utility bills, fuel purchase logs',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 73,
              question: 'Have you implemented any projects to improve energy efficiency (e.g., upgrading machinery, installing LED lighting)?',
              rationale: 'Energy Conservation',
              frameworks: 'Federal Energy Management Regulation: Targets 33% energy reduction, Policy for Advanced Industries: Promotes energy efficiency',
              data_source: 'Project reports, equipment specifications',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 74,
              question: 'Do you monitor air emissions from your stacks or vents?',
              rationale: 'Air Quality',
              frameworks: 'Federal Energy Management Regulation: Targets 32% air quality improvement, Dubai Municipality: Requires air emission permits',
              data_source: 'Emissions monitoring reports',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 80,
              question: 'Do you track the types and quantities of industrial waste your facility generates?',
              rationale: 'Waste Generation',
              frameworks: 'Federal Law No. 12 of 2018: Regulates industrial waste',
              data_source: 'Waste inventory, disposal records',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 81,
              question: 'Do you have any programs to reduce, reuse, or recycle waste materials within your production process?',
              rationale: 'Circular Economy',
              frameworks: 'Policy for Advanced Industries: Promotes circular economy principles',
              data_source: 'Process flow diagrams, recycling records',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 90,
              question: 'Do you have a licensed contractor for disposing of hazardous waste?',
              rationale: 'Hazardous Waste Management',
              frameworks: 'Federal Law No. 12 of 2018: Regulates hazardous waste, JAFZA EHS Regulations: Covers hazardous waste disposal',
              data_source: 'Contractor license, waste transfer notes',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ]
        };

      case 'logistics':
        return {
          environmental: [
            {
              id: 100,
              question: 'Do you track total fuel consumption by your vehicle fleet monthly?',
              rationale: 'Fleet fuel tracking is essential for carbon footprint calculation',
              frameworks: 'Green Logistics Initiatives, Federal Climate Law',
              data_source: 'Fuel purchase receipts, fleet management system data',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 101,
              question: 'Does your fleet include any electric or hybrid vehicles?',
              rationale: 'Electric vehicles reduce emissions and support UAE green transition',
              frameworks: 'UAE Green Agenda 2030, Dubai Green Mobility Strategy',
              data_source: 'Vehicle registration documents, fleet specifications',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 102,
              question: 'Do you use software to optimize delivery routes to save fuel?',
              rationale: 'Route optimization reduces fuel consumption and emissions',
              frameworks: 'Green Logistics Initiatives, Smart City Strategy',
              data_source: 'Route optimization software reports, fuel savings data',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 103,
              question: 'Do you track monthly electricity consumption of warehouses?',
              rationale: 'Energy tracking enables efficiency improvements',
              frameworks: 'Federal Energy Management Regulation, Green Building Guidelines',
              data_source: 'Monthly utility bills, warehouse energy data',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 104,
              question: 'Do you use packaging made from recycled or biodegradable materials?',
              rationale: 'Sustainable packaging reduces waste and environmental impact',
              frameworks: 'UAE Circular Economy Policy, Plastic Reduction Strategy',
              data_source: 'Packaging material specifications, supplier certificates',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 110,
              question: 'Do you provide driver safety training programs?',
              rationale: 'Driver safety protects employees and the public',
              frameworks: 'UAE Traffic Law, Occupational Health and Safety Standards',
              data_source: 'Training records, safety program documentation',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 111,
              question: 'Do you have fair working conditions for all staff?',
              rationale: 'Fair labor practices are essential for social responsibility',
              frameworks: 'UAE Labor Law, ILO Standards',
              data_source: 'Employment contracts, worker rights policies',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 120,
              question: 'Do you have energy-saving features in warehouses (LED lighting, efficient HVAC)?',
              rationale: 'Energy-efficient facilities reduce operational costs and emissions',
              frameworks: 'Federal Energy Management Regulation, Green Building Guidelines',
              data_source: 'Equipment specifications, energy audit reports',
              category: 'governance',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 121,
              question: 'Do you have a program to take back and reuse packaging materials?',
              rationale: 'Reverse logistics supports circular economy principles',
              frameworks: 'UAE Circular Economy Policy, Waste Management Strategy',
              data_source: 'Packaging return program documentation, reuse statistics',
              category: 'governance',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ]
        };

      case 'education':
        return {
          environmental: [
            {
              id: 130,
              question: 'Does your school track its monthly electricity and water consumption?',
              rationale: 'Resource tracking enables efficiency improvements and cost savings',
              frameworks: 'Sustainable Schools Initiative (SSI), ADEK Sustainability Policy',
              data_source: 'Monthly utility bills, consumption tracking spreadsheets',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 131,
              question: 'Does your school have a program for recycling materials?',
              rationale: 'Recycling programs teach sustainability and reduce waste',
              frameworks: 'Emirates Coalition for Green Schools, Dubai Municipality Guidelines',
              data_source: 'Photos of recycling bins, waste segregation program documentation',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 132,
              question: 'Do you monitor the indoor air quality in classrooms and facilities?',
              rationale: 'Good air quality is essential for student health and learning',
              frameworks: 'ADEK Health and Safety Standards, Green Building Guidelines',
              data_source: 'Air quality monitoring reports, HVAC maintenance records',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 140,
              question: 'Do you have a student-led "Eco Club" or sustainability committee?',
              rationale: 'Student engagement develops environmental awareness and leadership',
              frameworks: 'Sustainable Schools Initiative (SSI), Emirates Green Schools',
              data_source: 'Club registration documents, activity photos and reports',
              category: 'social',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 141,
              question: 'Is sustainability integrated into the curriculum in any subjects?',
              rationale: 'Curriculum integration ensures comprehensive sustainability education',
              frameworks: 'ADEK Sustainability Policy, UAE Vision 2071',
              data_source: 'Curriculum plans, lesson plans with sustainability topics',
              category: 'social',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 142,
              question: 'Does your school cafeteria have a policy to promote healthy/local food?',
              rationale: 'Healthy local food supports student wellbeing and local economy',
              frameworks: 'ADEK Health Standards, Sustainable Schools Initiative',
              data_source: 'Cafeteria policies, local supplier contracts',
              category: 'social',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 150,
              question: 'Does your school have a formal, written sustainability strategy?',
              rationale: 'Formal strategy demonstrates commitment and guides implementation',
              frameworks: 'Sustainable Schools Initiative (SSI), ADEK Requirements',
              data_source: 'Signed sustainability strategy documents',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 151,
              question: 'Does the school have a program for reusing old uniforms and textbooks?',
              rationale: 'Reuse programs reduce waste and support less privileged families',
              frameworks: 'UAE Circular Economy Policy, School Social Responsibility',
              data_source: 'Reuse program documentation, donation records',
              category: 'governance',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ]
        };

      case 'health':
        return {
          environmental: [
            {
              id: 160,
              question: 'Do you track your facility\'s monthly electricity and water consumption?',
              rationale: 'Resource tracking enables efficiency improvements in healthcare facilities',
              frameworks: 'DoH Sustainability Goals, Green Building Regulations',
              data_source: 'Monthly utility bills, energy management system data',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 161,
              question: 'Do you segregate different types of medical waste at point of generation?',
              rationale: 'Proper medical waste segregation is essential for safety and compliance',
              frameworks: 'MOHAP Hospital Regulations, Federal Health Laws',
              data_source: 'Waste segregation procedures, staff training records',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 162,
              question: 'Have you implemented measures to reduce single-use plastics in non-clinical areas?',
              rationale: 'Plastic reduction supports environmental sustainability',
              frameworks: 'UAE Plastic Reduction Strategy, DoH Sustainability Goals',
              data_source: 'Plastic reduction program documentation, alternative product specifications',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 163,
              question: 'Have you installed energy-efficient equipment (LED lighting, efficient HVAC)?',
              rationale: 'Energy efficiency reduces operational costs and environmental impact',
              frameworks: 'Federal Energy Management Regulation, Green Building Guidelines',
              data_source: 'Equipment specifications, energy audit reports',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 170,
              question: 'Do you have patient safety programs and incident reporting systems?',
              rationale: 'Patient safety is the cornerstone of healthcare social responsibility',
              frameworks: 'MOHAP Hospital Regulations, DHA Guidelines',
              data_source: 'Safety policies, incident reports, patient satisfaction surveys',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 171,
              question: 'Do you have employee wellbeing and mental health support programs?',
              rationale: 'Healthcare worker wellbeing is essential for quality patient care',
              frameworks: 'UAE Labor Law, Healthcare Worker Protection Standards',
              data_source: 'Employee wellbeing program documentation, mental health resources',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 180,
              question: 'Does your facility have a sustainability plan to reduce energy, water, and waste?',
              rationale: 'Comprehensive sustainability planning demonstrates environmental stewardship',
              frameworks: 'DoH Sustainability Goals, Green Building Regulations',
              data_source: 'Sustainability plan documents, implementation timelines',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 181,
              question: 'Do you have a contract with a licensed company for biomedical waste disposal?',
              rationale: 'Licensed disposal ensures safe handling of hazardous medical waste',
              frameworks: 'MOHAP Hospital Regulations, Federal Health Laws',
              data_source: 'Waste disposal contracts, licensed contractor certificates',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 182,
              question: 'Was your facility built according to green building standards?',
              rationale: 'Green buildings provide healthier environments for patients and staff',
              frameworks: 'Green Building Regulations, DoH Facility Standards',
              data_source: 'Green building certification documents, construction specifications',
              category: 'governance',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 183,
              question: 'Do you have a program to reduce paper use by transitioning to electronic records?',
              rationale: 'Electronic records reduce environmental impact and improve efficiency',
              frameworks: 'Digital Health Strategy, Environmental Sustainability Goals',
              data_source: 'Electronic records system documentation, paper reduction metrics',
              category: 'governance',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ]
        };

      default:
        return {
          environmental: [
            {
              id: 190,
              question: 'Do you track monthly consumption of all energy sources?',
              rationale: 'Energy tracking is fundamental for carbon footprint calculation',
              frameworks: 'Federal Energy Management Regulation, ISO 14001',
              data_source: 'Monthly utility bills, energy consumption data',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 200,
              question: 'Do you provide training and development programs for employees?',
              rationale: 'Employee development is a key social responsibility',
              frameworks: 'GRI 404-2, UAE Vision 2071',
              data_source: 'Training records, employee development plans',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 210,
              question: 'Do you have a formal environmental management system?',
              rationale: 'Systematic environmental management ensures compliance',
              frameworks: 'ISO 14001, Federal Environmental Law',
              data_source: 'Environmental management system documentation',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ]
        };
    }
  };

  // Get applicable frameworks for each sector
  const getSectorFrameworks = (sector: string) => {
    const commonFrameworks = [
      'GRI Standards',
      'UAE Vision 2071',
      'Federal Climate Law 2024'
    ];

    const sectorSpecificFrameworks: Record<string, string[]> = {
      'hospitality': [
        'Dubai Sustainable Tourism (DST)',
        'Green Key Global Certification',
        'Carbon Calculator Compliance'
      ],
      'construction': [
        'Al Sa\'fat Dubai Green Building',
        'Estidama Pearl Rating',
        'Dubai Municipality Requirements',
        'Federal Environmental Law'
      ],
      'manufacturing': [
        'ISO 14001 Environmental Management',
        'Federal Energy Management Regulation',
        'UAE Policy for Advanced Industries',
        'Free Zone EHS Regulations'
      ],
      'logistics': [
        'Green Logistics Initiatives',
        'UAE Green Agenda 2030',
        'Dubai Green Mobility Strategy',
        'Smart City Strategy'
      ],
      'education': [
        'Sustainable Schools Initiative (SSI)',
        'ADEK Sustainability Policy',
        'Emirates Coalition for Green Schools',
        'Green Building Regulations'
      ],
      'health': [
        'DoH Sustainability Goals',
        'MOHAP Hospital Regulations',
        'DHA Guidelines',
        'Federal Health Laws'
      ]
    };

    return [
      ...commonFrameworks,
      ...(sectorSpecificFrameworks[sector.toLowerCase()] || [])
    ];
  };

  const sectorQuestions = getSectorQuestions(businessSector);

  const allQuestions = {
    'Environmental': sectorQuestions.environmental,
    'Social': sectorQuestions.social,
    'Governance': sectorQuestions.governance
  };

  const mockScopingData: ESGScopingData = {
    sector: businessSector,
    total_questions: Object.values(allQuestions).flat().length,
    categories: ['Environmental', 'Social', 'Governance'],
    questions_by_category: allQuestions,
    frameworks: getSectorFrameworks(businessSector)
  };

  // Use mock data instead of API call
  const scopingData = mockScopingData;
  const isLoading = false;
  const error = null;

  // Enhanced task generation logic with comprehensive framework tagging and sector-specific branching
  const generateTasksFromAnswers = (answers: Record<string, any>, sector: string) => {
    const generatedTasks: any[] = [];
    let taskIdCounter = 1;

    // Get all questions for the sector
    const sectorQuestions = getSectorQuestions(sector);
    const allQuestions = [
      ...sectorQuestions.environmental,
      ...sectorQuestions.social,
      ...sectorQuestions.governance
    ];

    // Get location data for meter integration using user-specific key
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const companyId = currentUser.company_id;
    const locationKey = companyId ? `onboarding_locations_${companyId}` : 'locationData';
    const locationData = JSON.parse(localStorage.getItem(locationKey) || '[]');
    
    const allMeters = locationData.flatMap((loc: any) => 
      loc.meters?.map((meter: any) => ({
        ...meter,
        locationName: loc.name,
        locationId: loc.id
      })) || []
    );

    allQuestions.forEach((question) => {
      const answer = answers[question.id];
      const taskId = `task_${String(taskIdCounter).padStart(3, '0')}`;

      // Sector-specific branching logic based on MD requirements
      const branchingResults = applySectorSpecificBranching(question, answer, sector, answers);
      
      branchingResults.forEach((branchResult) => {
        const enhancedTaskData = generateEnhancedTask(branchResult.question, branchResult.answer, branchResult.taskType, allMeters);
        
        // Add meter information for billing-related tasks
        const meterInfo = getMeterInfoForTask(branchResult.question, allMeters);
        
        const task = {
          title: branchResult.customTitle || generateTaskTitle(branchResult.question),
          description: branchResult.customDescription || generateTaskDescription(branchResult.question),
          status: 'todo' as const,
          category: enhancedTaskData.category.toLowerCase() as 'environmental' | 'social' | 'governance',
          due_date: branchResult.customDueDate || calculateDueDate(branchResult.question.frameworks, branchResult.taskType === 'improvement'),
          assigned_user: 'Unassigned',
          evidence_count: 0,
          required_evidence: enhancedTaskData.evidenceRequired.length,
          
          // ESG-specific fields
          frameworks: enhancedTaskData.frameworks,
          priority: branchResult.customPriority || enhancedTaskData.priority,
          compliance_context: branchResult.complianceContext || `This task addresses a compliance gap identified in your ESG assessment. ${branchResult.question.rationale}`,
          action_required: branchResult.actionRequired || `Complete the following: ${branchResult.question.question.replace(/^Do you /, '')}. Required evidence: ${enhancedTaskData.evidenceRequired.join(', ')}`,
          framework_tags: enhancedTaskData.frameworks,
          evidence_required: enhancedTaskData.evidenceRequired,
          created_from_assessment: true,
          sector: enhancedTaskData.sector,
          estimated_hours: enhancedTaskData.estimatedHours,
          compliance_level: enhancedTaskData.complianceLevel,
          regulatory_requirement: isRegulatoryRequirement(branchResult.question.frameworks),
          task_type: branchResult.taskType as const,
          created_at: new Date().toISOString(),
          
          // Meter integration for billing tasks
          meter_info: meterInfo,
          requires_meter_data: meterInfo.length > 0,
          recurring_frequency: branchResult.recurringFrequency || null,
          phase_dependency: branchResult.phaseDependency || null,
          
          audit_trail: {
            created_at: new Date().toISOString(),
            question_id: branchResult.question.id,
            answer: branchResult.answer,
            triggered_by: branchResult.triggeredBy || 'assessment_response',
            branching_logic: branchResult.branchingLogic || 'standard'
          }
        };
        generatedTasks.push(task);
        taskIdCounter++;
      });
    });

    // Generate framework-specific mandatory tasks
    const frameworkTasks = generateFrameworkSpecificTasks(sector, answers, allMeters);
    generatedTasks.push(...frameworkTasks);

    return generatedTasks;
  };

  // Helper functions for task generation
  const generateTaskTitle = (question: ESGQuestion) => {
    const taskTitles: Record<string, string> = {
      'Do you track monthly electricity consumption': 'Implement Energy Consumption Tracking',
      'Do you have a written sustainability policy': 'Develop Written Sustainability Policy',
      'Do you provide regular training for all staff': 'Implement Staff Sustainability Training',
      'Do you have a Construction and Demolition': 'Develop C&D Waste Management Plan',
      'Are you pursuing green building certification': 'Pursue Green Building Certification',
      'Do you have a certified Environmental Management System': 'Implement ISO 14001 EMS',
      'Do you track total fuel consumption': 'Implement Fleet Fuel Tracking System',
      'Does your school have a formal': 'Develop School Sustainability Strategy',
      'Do you segregate different types of medical waste': 'Implement Medical Waste Segregation Program'
    };

    for (const [key, title] of Object.entries(taskTitles)) {
      if (question.question.includes(key)) {
        return title;
      }
    }

    // Default task title generation
    return `Implement ${question.question.replace(/^Do you /, '').replace(/\?$/, '')}`;
  };

  const generateTaskDescription = (question: ESGQuestion) => {
    return `Address compliance gap: ${question.question.replace(/^Do you /, 'Implement ')} 
    
Rationale: ${question.rationale}

This task is required for compliance with: ${question.frameworks}`;
  };

  const generateOngoingTaskTitle = (question: ESGQuestion) => {
    const ongoingTitles: Record<string, string> = {
      'track monthly electricity consumption': 'Monthly Energy Consumption Reporting',
      'track total fuel consumption': 'Monthly Fleet Fuel Reporting',
      'track monthly consumption of all energy': 'Monthly Energy Data Collection',
      'track your facility': 'Monthly Facility Resource Reporting'
    };

    for (const [key, title] of Object.entries(ongoingTitles)) {
      if (question.question.toLowerCase().includes(key)) {
        return title;
      }
    }

    return `Ongoing Monitoring: ${question.question.replace(/^Do you /, '')}`;
  };

  const generateOngoingTaskDescription = (question: ESGQuestion) => {
    return `Maintain ongoing compliance by continuing: ${question.question.replace(/^Do you /, '')}

Evidence needed: ${question.data_source}

This ongoing monitoring supports: ${question.frameworks}`;
  };

  const isOngoingTrackingRequired = (question: ESGQuestion) => {
    const trackingKeywords = ['track', 'monitor', 'measure', 'record'];
    return trackingKeywords.some(keyword => 
      question.question.toLowerCase().includes(keyword)
    );
  };

  const determinePriority = (frameworks: string) => {
    const highPriorityFrameworks = [
      'DST Mandatory',
      'Al Sa\'fat Mandatory',
      'MOHAP',
      'Federal',
      'Dubai Municipality Requirements',
      'ISO 14001'
    ];

    const mediumPriorityFrameworks = [
      'Green Key',
      'Estidama',
      'ADEK',
      'DoH'
    ];

    if (highPriorityFrameworks.some(framework => frameworks.includes(framework))) {
      return 'High';
    } else if (mediumPriorityFrameworks.some(framework => frameworks.includes(framework))) {
      return 'Medium';
    }
    return 'Low';
  };

  const calculateDueDate = (frameworks: string, isOptional = false) => {
    const today = new Date();
    let daysToAdd = 90; // Default 3 months

    if (isOptional) {
      daysToAdd = 180; // 6 months for optional improvements
    } else if (frameworks.includes('Mandatory') || frameworks.includes('Federal') || frameworks.includes('MOHAP')) {
      daysToAdd = 30; // 1 month for mandatory/regulatory requirements
    } else if (frameworks.includes('ISO 14001') || frameworks.includes('Green Key')) {
      daysToAdd = 60; // 2 months for certification requirements
    }

    const dueDate = new Date(today.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return dueDate.toISOString().split('T')[0];
  };

  // Framework tagging system
  const generateFrameworkTags = (frameworks: string) => {
    const frameworkList = frameworks.split(', ').map(f => f.trim());
    const tags: any[] = [];

    frameworkList.forEach(framework => {
      if (framework.includes('DST')) {
        tags.push({
          name: 'Dubai Sustainable Tourism',
          code: 'DST',
          type: 'municipal',
          mandatory: framework.includes('Mandatory'),
          authority: 'Dubai Department of Tourism and Commerce Marketing',
          description: 'Dubai sustainable tourism certification requirements'
        });
      }

      if (framework.includes('Green Key')) {
        tags.push({
          name: 'Green Key Global',
          code: 'GREEN_KEY',
          type: 'certification',
          mandatory: false,
          authority: 'Foundation for Environmental Education',
          description: 'International eco-label for tourism accommodation'
        });
      }

      if (framework.includes('Al Sa\'fat') || framework.includes('Al Safat')) {
        tags.push({
          name: 'Al Sa\'fat Green Building',
          code: 'AL_SAFAT',
          type: 'municipal',
          mandatory: framework.includes('Mandatory'),
          authority: 'Dubai Municipality',
          description: 'Dubai green building regulation and certification'
        });
      }

      if (framework.includes('Estidama')) {
        tags.push({
          name: 'Estidama Pearl Rating',
          code: 'ESTIDAMA',
          type: 'municipal',
          mandatory: true,
          authority: 'Abu Dhabi Urban Planning Council',
          description: 'Abu Dhabi sustainable building rating system'
        });
      }

      if (framework.includes('ISO 14001')) {
        tags.push({
          name: 'ISO 14001 Environmental Management',
          code: 'ISO_14001',
          type: 'certification',
          mandatory: false,
          authority: 'International Organization for Standardization',
          description: 'International environmental management system standard'
        });
      }

      if (framework.includes('Federal')) {
        tags.push({
          name: 'Federal Environmental Law',
          code: 'FEDERAL_ENV',
          type: 'regulatory',
          mandatory: true,
          authority: 'UAE Federal Government',
          description: 'UAE federal environmental regulations and compliance'
        });
      }

      if (framework.includes('MOHAP')) {
        tags.push({
          name: 'Ministry of Health Regulations',
          code: 'MOHAP',
          type: 'regulatory',
          mandatory: true,
          authority: 'Ministry of Health and Prevention',
          description: 'UAE healthcare facility regulations and standards'
        });
      }

      if (framework.includes('ADEK')) {
        tags.push({
          name: 'ADEK Sustainability Policy',
          code: 'ADEK',
          type: 'educational',
          mandatory: true,
          authority: 'Abu Dhabi Department of Education and Knowledge',
          description: 'Abu Dhabi educational institution sustainability requirements'
        });
      }

      if (framework.includes('DoH')) {
        tags.push({
          name: 'Department of Health Goals',
          code: 'DOH',
          type: 'regulatory',
          mandatory: true,
          authority: 'Abu Dhabi Department of Health',
          description: 'Abu Dhabi healthcare sustainability requirements'
        });
      }

      if (framework.includes('GRI')) {
        tags.push({
          name: 'Global Reporting Initiative',
          code: 'GRI',
          type: 'reporting',
          mandatory: false,
          authority: 'Global Reporting Initiative',
          description: 'International sustainability reporting standards'
        });
      }

      if (framework.includes('LEED')) {
        tags.push({
          name: 'LEED Certification',
          code: 'LEED',
          type: 'certification',
          mandatory: false,
          authority: 'US Green Building Council',
          description: 'Leadership in Energy and Environmental Design certification'
        });
      }

      if (framework.includes('BREEAM')) {
        tags.push({
          name: 'BREEAM Assessment',
          code: 'BREEAM',
          type: 'certification',
          mandatory: false,
          authority: 'Building Research Establishment',
          description: 'Building Research Establishment Environmental Assessment Method'
        });
      }
    });

    return tags;
  };

  const isRegulatoryRequirement = (frameworks: string) => {
    const regulatoryKeywords = [
      'Mandatory', 'Federal', 'MOHAP', 'Dubai Municipality Requirements', 
      'Abu Dhabi', 'ADEK', 'DoH', 'Law', 'Regulation'
    ];
    
    return regulatoryKeywords.some(keyword => frameworks.includes(keyword));
  };

  const calculateOngoingDueDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return nextMonth.toISOString().split('T')[0];
  };

  // Evidence requirements mapping based on task categories and frameworks
  // Enhanced function to generate meter-specific evidence requirements
  const generateMeterSpecificEvidence = (questionType: string, allMeters: any[]) => {
    console.log('DEBUG: generateMeterSpecificEvidence called for:', questionType, 'with meters:', allMeters);
    const meterSpecificEvidence: string[] = [];
    
    if (questionType === 'electricity consumption') {
      const electricityMeters = allMeters.filter(meter => meter.type === 'electricity');
      
      if (electricityMeters.length > 0) {
        electricityMeters.forEach(meter => {
          const provider = meter.provider || 'DEWA';
          const meterNumber = meter.meterNumber || 'meter';
          const description = meter.description || meter.locationName || 'location';
          
          // Specific bills for each meter
          meterSpecificEvidence.push(`Monthly ${provider} electricity bills for meter ${meterNumber} (${description})`);
          
          // Specific meter readings for each meter
          meterSpecificEvidence.push(`Electricity meter readings for meter ${meterNumber} at ${description}`);
        });
        
        // Common evidence (meter-aware)
        meterSpecificEvidence.push(
          'Consolidated energy consumption tracking spreadsheet for all electricity meters',
          'Building management system (BMS) electricity consumption data'
        );
      } else {
        // Fallback to generic evidence if no specific meters
        meterSpecificEvidence.push(
          'Monthly DEWA electricity bills',
          'Energy consumption tracking spreadsheet',
          'Meter reading logs',
          'Building management system (BMS) data'
        );
      }
    } else if (questionType === 'water consumption') {
      const waterMeters = allMeters.filter(meter => meter.type === 'water');
      console.log('DEBUG: Water meters found:', waterMeters);
      
      if (waterMeters.length > 0) {
        waterMeters.forEach(meter => {
          const provider = meter.provider || 'DEWA';
          const meterNumber = meter.meterNumber || 'meter';
          const description = meter.description || meter.locationName || 'location';
          
          // Specific bills for each meter
          meterSpecificEvidence.push(`Monthly ${provider} water bills for meter ${meterNumber} (${description})`);
          
          // Specific meter readings for each meter
          meterSpecificEvidence.push(`Water meter readings for meter ${meterNumber} at ${description}`);
        });
        
        // Common evidence (meter-aware)
        meterSpecificEvidence.push(
          'Consolidated water consumption tracking spreadsheet for all water meters',
          'Water conservation reports with meter-specific data',
          'Leak detection and repair records for monitored water meters'
        );
      } else {
        // Fallback to generic evidence if no specific meters
        meterSpecificEvidence.push(
          'Monthly water bills',
          'Water meter readings',
          'Water conservation reports',
          'Leak detection and repair records'
        );
      }
    } else if (questionType === 'gas consumption') {
      const gasMeters = allMeters.filter(meter => meter.type === 'gas');
      
      if (gasMeters.length > 0) {
        gasMeters.forEach(meter => {
          const provider = meter.provider || 'Gas Provider';
          const meterNumber = meter.meterNumber || 'meter';
          const description = meter.description || meter.locationName || 'location';
          
          // Specific bills for each meter
          meterSpecificEvidence.push(`Monthly ${provider} gas bills for meter ${meterNumber} (${description})`);
          
          // Specific meter readings for each meter
          meterSpecificEvidence.push(`Gas meter readings for meter ${meterNumber} at ${description}`);
        });
        
        // Common evidence (meter-aware)
        meterSpecificEvidence.push(
          'Consolidated gas consumption tracking spreadsheet for all gas meters',
          'Gas safety inspection records for all monitored gas meters',
          'Gas appliance maintenance logs linked to meter consumption data'
        );
      } else {
        // Fallback to generic evidence if no specific meters
        meterSpecificEvidence.push(
          'Monthly gas bills',
          'Gas consumption tracking spreadsheet',
          'Gas meter readings',
          'Gas safety inspection records'
        );
      }
    }
    
    return meterSpecificEvidence;
  };

  const getEvidenceRequirements = (question: ESGQuestion, allMeters: any[] = []) => {
    const evidenceMap: Record<string, string[]> = {
      // Governance & Management Evidence
      'sustainability policy': [
        'Signed sustainability policy documents',
        'Board resolution approving policy',
        'Policy distribution records to staff'
      ],
      'designated person': [
        'Job descriptions for sustainability roles',
        'Organizational chart showing reporting structure',
        'Appointment letter or contract'
      ],
      'training': [
        'Training records and materials',
        'Training certificates',
        'Attendance records',
        'Training evaluation forms'
      ],
      'committee': [
        'Committee meeting minutes',
        'Committee charter or terms of reference',
        'Member appointment letters'
      ],

      // Energy & Emissions Evidence - will be enhanced with meter-specific data
      'electricity consumption': generateMeterSpecificEvidence('electricity consumption', allMeters),
      'electricity': generateMeterSpecificEvidence('electricity consumption', allMeters),
      'electricity usage': generateMeterSpecificEvidence('electricity consumption', allMeters),
      'electricity monitoring': generateMeterSpecificEvidence('electricity consumption', allMeters),
      'water consumption': generateMeterSpecificEvidence('water consumption', allMeters),
      'water': generateMeterSpecificEvidence('water consumption', allMeters),
      'water usage': generateMeterSpecificEvidence('water consumption', allMeters),
      'water monitoring': generateMeterSpecificEvidence('water consumption', allMeters),
      'gas consumption': generateMeterSpecificEvidence('gas consumption', allMeters),
      'gas': generateMeterSpecificEvidence('gas consumption', allMeters),
      'gas usage': generateMeterSpecificEvidence('gas consumption', allMeters),
      'gas monitoring': generateMeterSpecificEvidence('gas consumption', allMeters),
      'fuel': [
        'Fuel purchase receipts/logs (diesel, petrol, LPG)',
        'Generator maintenance records',
        'Fuel consumption tracking spreadsheet'
      ],
      'district cooling': [
        'District cooling service bills',
        'Cooling system specifications',
        'Energy efficiency certificates'
      ],
      'LED lighting': [
        'Equipment specifications (LED lighting)',
        'Lighting audit report',
        'Purchase invoices for LED bulbs',
        'Photos of lighting installations'
      ],
      'energy efficiency': [
        'Energy audit reports',
        'Equipment specifications',
        'Energy efficiency project documentation',
        'Savings calculation reports'
      ],

      // Waste Management Evidence
      'waste': [
        'Waste contractor invoices/reports',
        'Waste transfer notes from recycling facilities',
        'Photos of waste segregation bins',
        'Waste tracking spreadsheet'
      ],
      'C&D waste': [
        'C&D Waste Management Plan documents',
        'Waste contractor licenses',
        'Disposal certificates',
        'Photos of segregation areas'
      ],
      'medical waste': [
        'Waste segregation procedures',
        'Biomedical waste disposal contracts',
        'Licensed contractor certificates',
        'Staff training records on waste handling'
      ],
      'hazardous waste': [
        'Contractor licenses and agreements',
        'Hazardous waste disposal certificates',
        'Waste manifest documents',
        'Emergency response procedures'
      ],

      // Water Management Evidence
      'water consumption': [
        'Monthly water bills',
        'Water meter readings',
        'Water conservation reports',
        'Leak detection and repair records'
      ],
      'water-efficient': [
        'Fixture specifications',
        'Water efficiency certificates',
        'Installation photos',
        'Water savings calculations'
      ],

      // Certifications & Compliance Evidence
      'green building certification': [
        'Green building certification documents',
        'Al Sa\'fat/Estidama registration',
        'LEED/BREEAM certificates',
        'Design compliance reports'
      ],
      'ISO 14001': [
        'ISO 14001 certificates',
        'EMS documentation',
        'Internal audit reports',
        'Management review records'
      ],
      'Environmental Impact Assessment': [
        'Environmental Impact Assessment (EIA) reports',
        'Environmental clearance certificates',
        'Mitigation measure implementation reports',
        'Monitoring reports'
      ],

      // Procurement & Supply Chain Evidence
      'local suppliers': [
        'Purchasing policies',
        'Sample supplier invoices',
        'Supplier certificates (local, organic, fair-trade)',
        'Procurement tracking spreadsheet'
      ],
      'materials': [
        'Material procurement records',
        'Supplier sustainability certificates',
        'Local sourcing documentation',
        'Recycled content specifications'
      ],

      // Operational Evidence
      'monitoring': [
        'Monitoring reports',
        'Data collection spreadsheets',
        'Equipment calibration certificates',
        'Quality control procedures'
      ],
      'fleet': [
        'Vehicle registration documents',
        'Fleet specifications',
        'Fuel consumption logs',
        'Route optimization software reports'
      ],
      'air quality': [
        'Air quality monitoring reports',
        'Stack emission data',
        'HVAC maintenance records',
        'Indoor air quality assessments'
      ],

      // Education Specific Evidence
      'curriculum': [
        'Curriculum plans',
        'Lesson plans with sustainability topics',
        'Educational materials',
        'Student project examples'
      ],
      'eco club': [
        'Club registration documents',
        'Activity photos and reports',
        'Student leadership records',
        'Project documentation'
      ],

      // Healthcare Specific Evidence
      'patient safety': [
        'Safety policies and procedures',
        'Incident reports',
        'Patient satisfaction surveys',
        'Safety training records'
      ],
      'electronic records': [
        'Electronic records system documentation',
        'Paper reduction metrics',
        'System implementation timeline',
        'Staff training on digital systems'
      ]
    };

    // Find matching evidence requirements
    const questionLower = question.question.toLowerCase();
    let evidenceRequirements: string[] = [question.data_source];

    // Debug logging for water-related questions
    if (questionLower.includes('water')) {
      console.log('DEBUG: Water question found:', questionLower);
      console.log('DEBUG: Available water keywords:', Object.keys(evidenceMap).filter(k => k.includes('water')));
    }

    for (const [keyword, requirements] of Object.entries(evidenceMap)) {
      if (questionLower.includes(keyword)) {
        if (questionLower.includes('water')) {
          console.log('DEBUG: Matched water keyword:', keyword);
          console.log('DEBUG: Water requirements:', requirements);
        }
        evidenceRequirements = requirements;
        break;
      }
    }
    
    // Fallback catch-all for water-related questions that might not match exact keywords
    if (questionLower.includes('water')) {
      console.log('DEBUG: FORCE Using water evidence for question:', questionLower);
      console.log('DEBUG: Current evidence before override:', evidenceRequirements);
      evidenceRequirements = generateMeterSpecificEvidence('water consumption', allMeters);
      console.log('DEBUG: New water evidence after override:', evidenceRequirements);
    }
    
    // Fallback catch-all for gas-related questions that might not match exact keywords  
    if (questionLower.includes('gas') && evidenceRequirements.length <= 1) {
      console.log('DEBUG: Using fallback gas evidence for question:', questionLower);
      evidenceRequirements = generateMeterSpecificEvidence('gas consumption', allMeters);
    }

    // Add framework-specific evidence requirements
    if (question.frameworks.includes('DST')) {
      evidenceRequirements.push('Dubai Sustainable Tourism compliance documentation');
    }
    if (question.frameworks.includes('Green Key')) {
      evidenceRequirements.push('Green Key audit checklist evidence');
    }
    if (question.frameworks.includes('Al Sa\'fat')) {
      evidenceRequirements.push('Al Sa\'fat credit documentation');
    }
    if (question.frameworks.includes('Estidama')) {
      evidenceRequirements.push('Estidama Pearl Rating evidence');
    }
    if (question.frameworks.includes('MOHAP')) {
      evidenceRequirements.push('MOHAP regulatory compliance documentation');
    }

    return [...new Set(evidenceRequirements)]; // Remove duplicates
  };

  // Enhanced task generation with detailed evidence requirements
  const generateEnhancedTask = (question: ESGQuestion, answer: string, taskType: 'compliance' | 'monitoring', allMeters: any[] = []) => {
    const evidenceRequirements = getEvidenceRequirements(question, allMeters);
    const frameworks = question.frameworks.split(', ').filter(f => f.trim());
    
    return {
      question: question.question,
      answer: answer,
      rationale: question.rationale,
      category: question.category.charAt(0).toUpperCase() + question.category.slice(1),
      sector: question.sector,
      frameworks: frameworks,
      evidenceRequired: evidenceRequirements,
      priority: determinePriority(question.frameworks),
      required: question.required,
      taskType: taskType,
      estimatedHours: estimateTaskHours(question, taskType),
      complianceLevel: getComplianceLevel(question.frameworks),
      documentationStandard: getDocumentationStandard(question.frameworks)
    };
  };

  const estimateTaskHours = (question: ESGQuestion, taskType: 'compliance' | 'monitoring') => {
    if (taskType === 'monitoring') return 2; // Ongoing monitoring tasks are quicker
    
    // Estimate hours based on task complexity
    if (question.frameworks.includes('ISO 14001') || question.frameworks.includes('EIA')) {
      return 40; // Complex certification/assessment tasks
    } else if (question.frameworks.includes('Policy') || question.frameworks.includes('Plan')) {
      return 16; // Policy/plan development
    } else if (question.frameworks.includes('Training')) {
      return 8; // Training implementation
    } else if (question.frameworks.includes('Tracking') || question.frameworks.includes('Monitor')) {
      return 4; // System setup for tracking
    }
    return 8; // Default task hours
  };

  const getComplianceLevel = (frameworks: string) => {
    if (frameworks.includes('Mandatory') || frameworks.includes('Federal') || frameworks.includes('MOHAP')) {
      return 'Regulatory - Mandatory';
    } else if (frameworks.includes('DST') || frameworks.includes('Al Sa\'fat')) {
      return 'Municipal - Required';
    } else if (frameworks.includes('ISO') || frameworks.includes('Green Key')) {
      return 'Certification - Voluntary';
    }
    return 'Best Practice - Optional';
  };

  const getDocumentationStandard = (frameworks: string) => {
    if (frameworks.includes('ISO 14001')) {
      return 'ISO 14001 Documentation Standards';
    } else if (frameworks.includes('Green Key')) {
      return 'Green Key Audit Standards';
    } else if (frameworks.includes('DST')) {
      return 'Dubai Sustainable Tourism Documentation';
    } else if (frameworks.includes('Al Sa\'fat')) {
      return 'Al Sa\'fat Credit Documentation Standards';
    }
    return 'General ESG Documentation Standards';
  };

  // Complete ESG scoping mutation with comprehensive analytics
  const completeScopingMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Mutation received data:', data);
      console.log('Data.answers:', data.answers);
      console.log('Data.sector:', data.sector);
      
      // Generate tasks based on answers
      const generatedTasks = generateTasksFromAnswers(data.answers, data.sector);
      console.log('Generated tasks:', generatedTasks);
      
      // Save tasks to storage
      const savedTasks = taskStorage.addTasks(generatedTasks);
      console.log('Tasks saved to storage:', savedTasks);
      
      // Dispatch custom event to notify TaskManagement page
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
      
      // Calculate comprehensive metrics for dashboard integration
      const totalQuestions = Object.values(scopingData.questions_by_category).flat().length;
      const allESGQuestions = Object.values(scopingData.questions_by_category).flat();
      const esgQuestionIds = allESGQuestions.map(q => q.id.toString());
      const esgAnswers = Object.keys(data.answers).filter(id => esgQuestionIds.includes(id));
      const esgAnswerValues = esgAnswers.map(id => data.answers[id]);
      const answeredQuestions = esgAnswers.length;
      const yesAnswers = esgAnswerValues.filter(answer => answer === 'yes').length;
      const noAnswers = esgAnswerValues.filter(answer => answer === 'no').length;
      
      const complianceTasks = generatedTasks.filter(t => t.taskType === 'compliance');
      const monitoringTasks = generatedTasks.filter(t => t.taskType === 'monitoring');
      const improvementTasks = generatedTasks.filter(t => t.taskType === 'improvement');
      
      const regulatoryTasks = generatedTasks.filter(t => t.regulatoryRequirement);
      const totalEstimatedHours = generatedTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
      
      // Calculate ESG scores by category
      const categoryScores = calculateCategoryScores(data.answers, data.sector);
      const overallESGScore = Math.round(
        (categoryScores.environmental + categoryScores.social + categoryScores.governance) / 3
      );
      
      // Framework coverage analysis
      const frameworkCoverage = analyzeFrameworkCoverage(generatedTasks);
      
      const completeData = {
        ...data,
        generatedTasks,
        completedAt: new Date().toISOString(),
        
        // Task Statistics
        totalTasksGenerated: generatedTasks.length,
        highPriorityTasks: generatedTasks.filter(t => t.priority === 'High').length,
        mediumPriorityTasks: generatedTasks.filter(t => t.priority === 'Medium').length,
        lowPriorityTasks: generatedTasks.filter(t => t.priority === 'Low').length,
        
        complianceTasks: complianceTasks.length,
        monitoringTasks: monitoringTasks.length,
        improvementTasks: improvementTasks.length,
        regulatoryTasks: regulatoryTasks.length,
        
        // Assessment Statistics
        totalQuestions,
        answeredQuestions,
        responseRate: Math.round((answeredQuestions / totalQuestions) * 100),
        yesAnswers,
        noAnswers,
        
        // ESG Performance Metrics
        overallESGScore,
        categoryScores,
        complianceRate: Math.round((yesAnswers / (yesAnswers + noAnswers)) * 100),
        
        // Resource Planning
        totalEstimatedHours,
        estimatedCompletionWeeks: Math.ceil(totalEstimatedHours / 40), // Assuming 40 hours per week
        
        // Framework Analysis
        frameworkCoverage,
        applicableFrameworks: getSectorFrameworks(data.sector),
        
        // Carbon Footprint Tracking Readiness
        carbonTrackingReadiness: calculateCarbonTrackingReadiness(data.answers),
        
        // Compliance Dashboard Metrics
        dashboardMetrics: {
          activeTasks: generatedTasks.length,
          criticalDeadlines: generatedTasks.filter(t => {
            const dueDate = new Date(t.dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilDue <= 30;
          }).length,
          frameworksInProgress: frameworkCoverage.activeFrameworks.length,
          completionPercentage: 0 // Will be updated as tasks are completed
        }
      };

      // Call the real API
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = currentUser.company_id;
      
      console.log('Current user from localStorage:', currentUser);
      console.log('Company ID:', companyId);
      
      if (!companyId) {
        throw new Error('Company ID not found. Please log in again.');
      }
      
      // Include location data for meter integration
      const locationData = JSON.parse(localStorage.getItem('locationData') || '[]');
      
      console.log('About to call API with:', {
        companyId,
        sector: data.sector,
        answers: data.answers,
        preferences: data.preferences,
        location_data: locationData
      });
      
      return esgAPI.completeScoping(companyId, {
        sector: data.sector,
        answers: data.answers,
        preferences: data.preferences,
        location_data: locationData
      }).then(response => {
        console.log('API Response:', response.data);
        
        // Merge API response with local analytics
        const mergedData = {
          ...completeData,
          ...response.data,
          apiResponse: response.data
        };
        
        return { success: true, data: mergedData };
      }).catch(apiError => {
        console.error('API call failed:', apiError);
        console.error('API error details:', {
          message: apiError.message,
          response: apiError.response?.data,
          status: apiError.response?.status,
          config: apiError.config
        });
        throw apiError;
      });
    },
    onSuccess: (data) => {
      console.log('ESG Scoping completed with comprehensive analytics:', data);
      
      // Save results to localStorage for the results page with user-specific key
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = currentUser.company_id;
      const assessmentKey = companyId ? `assessmentResults_${companyId}` : 'assessmentResults';
      localStorage.setItem(assessmentKey, JSON.stringify(data.data));
      
      // Navigate to results page
      navigate('/assessment/results');
      
      // Also call the original onComplete callback
      onComplete(data);
    },
    onError: (error) => {
      console.error('ESG Scoping failed:', error);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Show error message to user
      alert(`Failed to complete ESG scoping: ${error.message}. Please try again.`);
      
      // Optionally fall back to local storage
      console.log('Falling back to local storage...');
    }
  });

  // Helper functions for analytics
  const calculateCategoryScores = (answers: Record<string, any>, sector: string) => {
    const sectorQuestions = getSectorQuestions(sector);
    
    const calculateScore = (questions: ESGQuestion[]) => {
      const totalQuestions = questions.length;
      const yesAnswers = questions.filter(q => answers[q.id] === 'yes').length;
      return totalQuestions > 0 ? Math.round((yesAnswers / totalQuestions) * 100) : 0;
    };

    return {
      environmental: calculateScore(sectorQuestions.environmental),
      social: calculateScore(sectorQuestions.social),
      governance: calculateScore(sectorQuestions.governance)
    };
  };

  const analyzeFrameworkCoverage = (tasks: any[]) => {
    const allFrameworks = [...new Set(tasks.flatMap(t => t.frameworks))];
    const activeFrameworks = allFrameworks.filter(framework => 
      tasks.some(t => t.frameworks.includes(framework))
    );
    
    const mandatoryFrameworks = allFrameworks.filter(framework => 
      tasks.some(t => t.frameworks.includes(framework) && t.regulatoryRequirement)
    );
    
    const voluntaryFrameworks = allFrameworks.filter(framework => 
      tasks.some(t => t.frameworks.includes(framework) && !t.regulatoryRequirement)
    );

    return {
      totalFrameworks: allFrameworks.length,
      activeFrameworks,
      mandatoryFrameworks,
      voluntaryFrameworks,
      coveragePercentage: Math.round((activeFrameworks.length / getSectorFrameworks(businessSector).length) * 100)
    };
  };

  const calculateCarbonTrackingReadiness = (answers: Record<string, any>) => {
    const carbonTrackingQuestions = [
      'Do you track monthly electricity consumption',
      'Do you track total fuel consumption',
      'Do you track monthly consumption of all energy',
      'Do you track your facility'
    ];
    
    const totalTrackingQuestions = Object.keys(answers).length;
    const trackingYesAnswers = Object.entries(answers).filter(([questionId, answer]) => {
      const question = Object.values(scopingData.questions_by_category)
        .flat()
        .find(q => q.id === parseInt(questionId));
      
      return question && 
             carbonTrackingQuestions.some(trackingQ => question.question.includes(trackingQ)) &&
             answer === 'yes';
    }).length;
    
    return {
      readinessScore: totalTrackingQuestions > 0 ? Math.round((trackingYesAnswers / totalTrackingQuestions) * 100) : 0,
      trackingCapabilities: trackingYesAnswers,
      recommendations: trackingYesAnswers < 2 ? ['Implement energy monitoring systems', 'Set up monthly data collection'] : []
    };
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#111827',
        minHeight: '100vh',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '3rem',
          borderRadius: '0.75rem',
          border: '1px solid #374151',
          textAlign: 'center'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            border: '4px solid #374151',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <p style={{color: '#9ca3af', fontSize: '1.125rem'}}>Loading ESG scoping questions...</p>
        </div>
      </div>
    );
  }

  if (error || !scopingData) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#111827',
        minHeight: '100vh',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '3rem',
          borderRadius: '0.75rem',
          border: '1px solid #374151',
          textAlign: 'center',
          maxWidth: '28rem'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <span style={{fontSize: '2rem'}}>⚠️</span>
          </div>
          <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem'}}>
            Unable to Load Questions
          </h3>
          <p style={{color: '#9ca3af', marginBottom: '1.5rem'}}>
            We couldn't load the ESG scoping questions for the {businessSector} sector.
          </p>
          {onBack && (
            <button 
              onClick={onBack}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const categories = scopingData.categories;
  const currentCategoryName = categories[currentCategory];
  const currentQuestions = scopingData.questions_by_category[currentCategoryName] || [];
  const isLastCategory = currentCategory === categories.length - 1;
  // Calculate progress based only on ESG scoping questions, not pre-filled data
  const allESGQuestions = Object.values(scopingData.questions_by_category).flat();
  const esgQuestionIds = allESGQuestions.map(q => q.id.toString());
  const esgAnswers = Object.keys(answers).filter(id => esgQuestionIds.includes(id));
  const totalAnswered = esgAnswers.length;
  const progressPercentage = (totalAnswered / scopingData.total_questions) * 100;

  const handleAnswerChange = (questionId: number, value: any) => {
    console.log(`Answer changed - Question ${questionId}: ${value}`);
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: value
      };
      console.log('Updated answers state:', newAnswers);
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (isLastCategory) {
      // Complete the scoping wizard
      const scopingData = {
        sector: businessSector,
        answers,
        preferences
      };
      console.log('Submitting scoping data:', scopingData);
      console.log('Current answers:', answers);
      console.log('Total answers count:', Object.keys(answers).length);
      completeScopingMutation.mutate(scopingData);
    } else {
      setCurrentCategory(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategory > 0) {
      setCurrentCategory(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const renderQuestionInput = (question: ESGQuestion) => {
    const questionId = question.id;
    const currentAnswer = answers[questionId];

    switch (question.type) {
      case 'yes_no':
        return (
          <div style={{display: 'flex', gap: '1rem'}}>
            <button
              type="button"
              onClick={() => handleAnswerChange(questionId, 'yes')}
              style={{
                ...dashboardStyles.button,
                ...(currentAnswer === 'yes' ? dashboardStyles.primaryButton : dashboardStyles.secondaryButton),
                minWidth: '80px',
                justifyContent: 'center'
              }}
            >
              {currentAnswer === 'yes' && <span style={{marginRight: '0.5rem'}}>✓</span>}
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleAnswerChange(questionId, 'no')}
              style={{
                ...dashboardStyles.button,
                ...(currentAnswer === 'no' ? dashboardStyles.primaryButton : dashboardStyles.secondaryButton),
                minWidth: '80px',
                justifyContent: 'center'
              }}
            >
              {currentAnswer === 'no' && <span style={{marginRight: '0.5rem'}}>✓</span>}
              No
            </button>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            style={dashboardStyles.inputField}
            placeholder="Enter a number"
          />
        );

      case 'text':
        return (
          <textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            rows={3}
            style={{...dashboardStyles.inputField, resize: 'none'}}
            placeholder="Enter your answer"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            style={dashboardStyles.inputField}
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            style={dashboardStyles.inputField}
            placeholder="Enter your answer"
          />
        );
    }
  };

  const dashboardStyles = {
    container: {
      padding: '2rem',
      backgroundColor: '#111827',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      marginBottom: '3rem'
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: '1.5rem',
      color: '#9ca3af',
      marginBottom: '2rem'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem'
    },
    statCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    tabsContainer: {
      backgroundColor: '#1f2937',
      padding: '0.5rem',
      borderRadius: '0.75rem',
      marginBottom: '2rem',
      display: 'inline-flex',
      gap: '0.5rem'
    },
    tab: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    activeTab: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    inactiveTab: {
      backgroundColor: 'transparent',
      color: '#9ca3af'
    },
    questionCard: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '1.5rem'
    },
    questionTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '0.75rem'
    },
    questionSubtext: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginBottom: '1.5rem'
    },
    inputField: {
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      boxSizing: 'border-box'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#374151',
      color: 'white'
    }
  }

  // Sector-specific branching logic implementation
  const applySectorSpecificBranching = (question: ESGQuestion, answer: any, sector: string, allAnswers: Record<string, any>) => {
    const results: any[] = [];
    
    // Standard task generation for compliance gaps
    if (answer === 'no' && question.required) {
      results.push({
        question,
        answer,
        taskType: 'compliance',
        triggeredBy: 'compliance_gap',
        branchingLogic: 'mandatory_requirement'
      });
    }
    
    // Ongoing monitoring for "Yes" answers
    if (answer === 'yes' && isOngoingTrackingRequired(question)) {
      results.push({
        question,
        answer,
        taskType: 'monitoring',
        triggeredBy: 'ongoing_monitoring',
        branchingLogic: 'continuous_tracking',
        recurringFrequency: 'monthly'
      });
    }
    
    // Optional improvement tasks
    if (answer === 'no' && !question.required) {
      results.push({
        question,
        answer,
        taskType: 'improvement',
        triggeredBy: 'improvement_opportunity',
        branchingLogic: 'optional_enhancement',
        customTitle: `[Optional] ${generateTaskTitle(question)}`,
        customPriority: 'Low'
      });
    }
    
    // Sector-specific branching logic
    if (sector.toLowerCase() === 'hospitality') {
      results.push(...applyHospitalityBranching(question, answer, allAnswers));
    } else if (sector.toLowerCase() === 'construction') {
      results.push(...applyConstructionBranching(question, answer, allAnswers));
    } else if (sector.toLowerCase() === 'manufacturing') {
      results.push(...applyManufacturingBranching(question, answer, allAnswers));
    } else if (sector.toLowerCase() === 'health') {
      results.push(...applyHealthBranching(question, answer, allAnswers));
    } else if (sector.toLowerCase() === 'education') {
      results.push(...applyEducationBranching(question, answer, allAnswers));
    } else if (sector.toLowerCase() === 'logistics') {
      results.push(...applyLogisticsBranching(question, answer, allAnswers));
    }
    
    return results;
  };
  
  // Hospitality sector-specific branching
  const applyHospitalityBranching = (question: ESGQuestion, answer: any, allAnswers: Record<string, any>) => {
    const results: any[] = [];
    
    // DST Carbon Calculator mandatory requirements
    if (question.frameworks.includes('DST Carbon Calculator') && answer === 'no') {
      results.push({
        question,
        answer,
        taskType: 'compliance',
        triggeredBy: 'dst_mandatory_requirement',
        branchingLogic: 'dubai_sustainable_tourism',
        customPriority: 'High',
        customDueDate: calculateDueDate('DST Mandatory', false),
        complianceContext: 'This is a MANDATORY requirement for Dubai Sustainable Tourism compliance. All hotels must report monthly.',
        actionRequired: 'Set up monthly reporting system for DST Carbon Calculator with 9 mandatory inputs: electricity, water, district cooling, LPG, landfill waste, recycled waste, petrol, diesel, and refrigerants.',
        recurringFrequency: 'monthly'
      });
    }
    
    // Green Key certification pathway
    if (question.frameworks.includes('Green Key') && answer === 'yes') {
      results.push({
        question,
        answer,
        taskType: 'monitoring',
        triggeredBy: 'green_key_certification',
        branchingLogic: 'certification_pathway',
        customTitle: 'Maintain Green Key Certification Standards',
        customPriority: 'Medium',
        actionRequired: 'Document and maintain Green Key certification requirements with photographic evidence and regular audits.',
        recurringFrequency: 'quarterly'
      });
    }
    
    return results;
  };
  
  // Construction sector-specific branching
  const applyConstructionBranching = (question: ESGQuestion, answer: any, allAnswers: Record<string, any>) => {
    const results: any[] = [];
    
    // Phase-based task generation
    if (question.question.includes('green building certification') && answer === 'yes') {
      // Generate phase-specific tasks
      const phases = ['planning', 'construction', 'operational'];
      
      phases.forEach(phase => {
        results.push({
          question: {
            ...question,
            question: `Maintain ${phase} phase green building compliance`,
            rationale: `${phase} phase requirements for green building certification`
          },
          answer,
          taskType: 'compliance',
          triggeredBy: 'green_building_certification',
          branchingLogic: 'phase_based_construction',
          customTitle: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase: Green Building Compliance`,
          customPriority: phase === 'planning' ? 'High' : 'Medium',
          phaseDependency: phase,
          recurringFrequency: phase === 'operational' ? 'quarterly' : null
        });
      });
    }
    
    // C&D Waste Management mandatory requirements
    if (question.question.includes('C&D Waste Management') && answer === 'no') {
      results.push({
        question,
        answer,
        taskType: 'compliance',
        triggeredBy: 'federal_law_compliance',
        branchingLogic: 'waste_management_mandatory',
        customPriority: 'High',
        complianceContext: 'Federal Law No. 12 of 2018 mandates C&D waste management for all construction projects.',
        actionRequired: 'Develop comprehensive C&D Waste Management Plan with licensed contractors and segregation procedures.'
      });
    }
    
    return results;
  };
  
  // Manufacturing sector-specific branching
  const applyManufacturingBranching = (question: ESGQuestion, answer: any, allAnswers: Record<string, any>) => {
    const results: any[] = [];
    
    // ISO 14001 pathway vs basic compliance
    if (question.question.includes('ISO 14001') && answer === 'yes') {
      // Generate ISO 14001 certification maintenance tasks
      results.push({
        question,
        answer,
        taskType: 'monitoring',
        triggeredBy: 'iso_14001_certification',
        branchingLogic: 'certification_maintenance',
        customTitle: 'ISO 14001 Certification Maintenance',
        customPriority: 'Medium',
        actionRequired: 'Maintain ISO 14001 certification through regular internal audits, management reviews, and continuous improvement.',
        recurringFrequency: 'quarterly'
      });
    } else if (question.question.includes('ISO 14001') && answer === 'no') {
      // Basic compliance pathway
      results.push({
        question,
        answer,
        taskType: 'compliance',
        triggeredBy: 'basic_compliance_pathway',
        branchingLogic: 'alternative_compliance',
        customTitle: 'Establish Basic Environmental Management System',
        customPriority: 'Medium',
        actionRequired: 'Implement basic environmental management practices aligned with UAE federal requirements.'
      });
    }
    
    return results;
  };
  
  // Health sector-specific branching
  const applyHealthBranching = (question: ESGQuestion, answer: any, allAnswers: Record<string, any>) => {
    const results: any[] = [];
    
    // Medical waste segregation mandatory requirements
    if (question.question.includes('medical waste') && answer === 'no') {
      results.push({
        question,
        answer,
        taskType: 'compliance',
        triggeredBy: 'mohap_mandatory_requirement',
        branchingLogic: 'healthcare_compliance',
        customPriority: 'High',
        complianceContext: 'MOHAP Hospital Regulations mandate proper medical waste segregation at point of generation.',
        actionRequired: 'Implement medical waste segregation system with proper bins, staff training, and licensed disposal contracts.'
      });
    }
    
    // DoH Sustainability Goals pathway
    if (question.question.includes('sustainability plan') && answer === 'yes') {
      results.push({
        question,
        answer,
        taskType: 'monitoring',
        triggeredBy: 'doh_sustainability_goals',
        branchingLogic: 'healthcare_sustainability',
        customTitle: 'DoH Sustainability Goals Reporting',
        customPriority: 'Medium',
        actionRequired: 'Report progress toward DoH 20% carbon reduction by 2030 and Net Zero by 2050 goals.',
        recurringFrequency: 'quarterly'
      });
    }
    
    return results;
  };
  
  // Education sector-specific branching
  const applyEducationBranching = (question: ESGQuestion, answer: any, allAnswers: Record<string, any>) => {
    const results: any[] = [];
    
    // ADEK mandatory requirements
    if (question.frameworks.includes('ADEK') && answer === 'no') {
      results.push({
        question,
        answer,
        taskType: 'compliance',
        triggeredBy: 'adek_mandatory_requirement',
        branchingLogic: 'education_compliance',
        customPriority: 'High',
        complianceContext: 'ADEK Sustainability Policy mandates formal sustainability strategies for all Abu Dhabi schools.',
        actionRequired: 'Develop comprehensive sustainability strategy with curriculum integration and resource reuse programs.'
      });
    }
    
    // Sustainable Schools Initiative pathway
    if (question.question.includes('Eco Club') && answer === 'yes') {
      results.push({
        question,
        answer,
        taskType: 'monitoring',
        triggeredBy: 'sustainable_schools_initiative',
        branchingLogic: 'student_engagement',
        customTitle: 'Sustainable Schools Initiative Activities',
        customPriority: 'Medium',
        actionRequired: 'Maintain student-led sustainability activities through Green School Audits and Eco Club projects.',
        recurringFrequency: 'monthly'
      });
    }
    
    return results;
  };
  
  // Logistics sector-specific branching
  const applyLogisticsBranching = (question: ESGQuestion, answer: any, allAnswers: Record<string, any>) => {
    const results: any[] = [];
    
    // Fleet tracking mandatory requirements
    if (question.question.includes('fuel consumption') && answer === 'no') {
      results.push({
        question,
        answer,
        taskType: 'compliance',
        triggeredBy: 'climate_law_requirement',
        branchingLogic: 'fleet_compliance',
        customPriority: 'High',
        complianceContext: 'Federal Climate Law mandates GHG emissions tracking for all transportation fleets.',
        actionRequired: 'Implement fleet fuel consumption tracking system with monthly reporting for Scope 1 emissions.',
        recurringFrequency: 'monthly'
      });
    }
    
    // Green mobility pathway
    if (question.question.includes('electric or hybrid') && answer === 'yes') {
      results.push({
        question,
        answer,
        taskType: 'monitoring',
        triggeredBy: 'green_mobility_initiative',
        branchingLogic: 'green_transport',
        customTitle: 'Green Mobility Progress Tracking',
        customPriority: 'Medium',
        actionRequired: 'Monitor progress toward UAE Green Agenda 2030 goals and document EV adoption benefits.',
        recurringFrequency: 'quarterly'
      });
    }
    
    return results;
  };
  
  // Get meter information for billing-related tasks
  const getMeterInfoForTask = (question: ESGQuestion, allMeters: any[]) => {
    const billingKeywords = ['electricity', 'water', 'gas', 'utility', 'consumption', 'bills', 'meter'];
    const questionLower = question.question.toLowerCase();
    
    if (!billingKeywords.some(keyword => questionLower.includes(keyword))) {
      return [];
    }
    
    const relevantMeters = allMeters.filter(meter => {
      if (questionLower.includes('electricity') && meter.type === 'electricity') return true;
      if (questionLower.includes('water') && meter.type === 'water') return true;
      if (questionLower.includes('gas') && meter.type === 'gas') return true;
      return false;
    });
    
    return relevantMeters.map(meter => ({
      meterId: meter.id,
      meterNumber: meter.meterNumber,
      meterType: meter.type,
      description: meter.description,
      provider: meter.provider,
      locationName: meter.locationName,
      locationId: meter.locationId,
      required_for_task: true
    }));
  };
  
  // Generate framework-specific mandatory tasks
  const generateFrameworkSpecificTasks = (sector: string, answers: Record<string, any>, allMeters: any[]) => {
    const tasks: any[] = [];
    
    // DST Carbon Calculator mandatory registration for hospitality
    if (sector.toLowerCase() === 'hospitality') {
      tasks.push({
        title: 'DST Carbon Calculator Registration',
        description: 'Mandatory registration for Dubai Sustainable Tourism Carbon Calculator with monthly reporting setup.',
        status: 'todo',
        category: 'governance',
        due_date: calculateDueDate('DST Mandatory', false),
        priority: 'High',
        frameworks: ['Dubai Sustainable Tourism'],
        task_type: 'compliance',
        regulatory_requirement: true,
        compliance_context: 'All hotel establishments in Dubai must register for DST Carbon Calculator and provide monthly reports.',
        action_required: 'Register at DST portal and set up monthly reporting system for 9 mandatory inputs.',
        meter_info: allMeters.filter(m => ['electricity', 'water', 'gas'].includes(m.type)),
        requires_meter_data: true,
        recurring_frequency: 'monthly',
        created_from_assessment: true,
        estimated_hours: 8
      });
    }
    
    // Green building certification mandatory for construction
    if (sector.toLowerCase() === 'construction') {
      tasks.push({
        title: 'Green Building Certification Compliance',
        description: 'Mandatory green building certification for all new construction projects in Dubai/Abu Dhabi.',
        status: 'todo',
        category: 'environmental',
        due_date: calculateDueDate('Al Sa\'fat Mandatory', false),
        priority: 'High',
        frameworks: ['Al Sa\'fat Dubai', 'Estidama Pearl'],
        task_type: 'compliance',
        regulatory_requirement: true,
        compliance_context: 'All new buildings must achieve minimum Silver Sa\'fa (Dubai) or 1-Pearl (Abu Dhabi) certification.',
        action_required: 'Register project with appropriate certification body and ensure compliance with mandatory requirements.',
        phase_dependency: 'planning',
        created_from_assessment: true,
        estimated_hours: 40
      });
    }
    
    return tasks;
  };

  return (
    <div style={dashboardStyles.container}>
      {/* Header Section */}
      <div style={dashboardStyles.header}>
        <h1 style={dashboardStyles.title}>ESG Data Wizard</h1>
        <p style={dashboardStyles.subtitle}>Complete your sector-specific sustainability assessment to generate personalized ESG tasks</p>
        
        {/* Progress Stats */}
        <div style={dashboardStyles.statsGrid}>
          <div style={dashboardStyles.statCard}>
            <div style={{...dashboardStyles.statValue, color: '#10b981'}}>
              {currentCategory + 1}/{categories.length}
            </div>
            <div style={dashboardStyles.statLabel}>Current Step</div>
          </div>
          <div style={dashboardStyles.statCard}>
            <div style={{...dashboardStyles.statValue, color: '#3b82f6'}}>
              {totalAnswered}
            </div>
            <div style={dashboardStyles.statLabel}>Questions Completed</div>
          </div>
          <div style={dashboardStyles.statCard}>
            <div style={{...dashboardStyles.statValue, color: '#a855f7'}}>
              {Math.round(progressPercentage)}%
            </div>
            <div style={dashboardStyles.statLabel}>Progress</div>
          </div>
          <div style={dashboardStyles.statCard}>
            <div style={{...dashboardStyles.statValue, color: '#10b981'}}>
              {businessSector}
            </div>
            <div style={dashboardStyles.statLabel}>Business Sector</div>
          </div>
        </div>
      </div>

      {/* Category Navigation - Dashboard Style */}
      <div style={dashboardStyles.tabsContainer}>
        {categories.map((category, index) => {
          const isActive = index === currentCategory
          const isCompleted = index < currentCategory
          const categoryIcons = ['🌱', '👥', '⚖️'] // Environmental, Social, Governance
          
          return (
            <button
              key={category}
              onClick={() => setCurrentCategory(index)}
              style={{
                ...dashboardStyles.tab,
                ...(isActive ? dashboardStyles.activeTab : dashboardStyles.inactiveTab),
                ...(isCompleted && !isActive ? { backgroundColor: '#10b981', opacity: 0.7, color: 'white' } : {})
              }}
            >
              <span>{isCompleted ? '✓' : categoryIcons[index] || '📋'}</span>
              <span>{category}</span>
            </button>
          )
        })}
      </div>

      {/* Current Category Header */}
      <div style={{...dashboardStyles.questionCard, textAlign: 'center', marginBottom: '2rem'}}>
        <div style={{fontSize: '3rem', marginBottom: '1rem'}}>
          {['🌱', '👥', '⚖️'][currentCategory] || '📋'}
        </div>
        <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem'}}>
          {currentCategoryName}
        </h2>
        <p style={{color: '#9ca3af'}}>
          Answer the questions below to complete your {currentCategoryName.toLowerCase()} assessment
        </p>
      </div>

      {/* Questions Grid - Dashboard Style */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '3rem'}}>
        {currentQuestions.map((question) => (
          <div key={question.id} style={dashboardStyles.questionCard}>
            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={dashboardStyles.questionTitle}>
                {question.question}
              </h3>
              {question.rationale && (
                <p style={dashboardStyles.questionSubtext}>
                  <strong>Why this matters:</strong> {question.rationale}
                </p>
              )}
              {question.frameworks && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  display: 'inline-block',
                  marginBottom: '1rem'
                }}>
                  Frameworks: {question.frameworks}
                </div>
              )}
            </div>
            
            <div style={{marginBottom: '1rem'}}>
              {renderQuestionInput(question)}
            </div>

            {question.data_source && (
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                backgroundColor: '#374151',
                padding: '0.75rem',
                borderRadius: '0.5rem'
              }}>
                <strong>Evidence needed:</strong> {question.data_source}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Buttons - Dashboard Style */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem'}}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handlePrevious}
            style={{...dashboardStyles.button, ...dashboardStyles.secondaryButton}}
          >
            <span>←</span>
            <span>Previous</span>
          </button>
          
        </div>


        <div style={{display: 'flex', gap: '0.5rem'}}>
          {categories.map((_, index) => (
            <div
              key={index}
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: index <= currentCategory ? '#10b981' : '#374151'
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={completeScopingMutation.isPending}
          style={{
            ...dashboardStyles.button,
            ...dashboardStyles.primaryButton,
            ...(completeScopingMutation.isPending ? {opacity: 0.5} : {})
          }}
        >
          {completeScopingMutation.isPending ? (
            <>
              <span>⟳</span>
              <span>Processing...</span>
            </>
          ) : isLastCategory ? (
            <>
              <span>Complete Assessment</span>
              <span>✓</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>

      {/* Frameworks Info - Dashboard Style */}
      {scopingData.frameworks.length > 0 && (
        <div style={{...dashboardStyles.questionCard, marginTop: '2rem'}}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            📋 Applicable Frameworks for {businessSector} Sector
          </h3>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center'}}>
            {scopingData.frameworks.map((framework) => (
              <span 
                key={framework}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {framework}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}