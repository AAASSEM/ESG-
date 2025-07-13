import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
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

  // Comprehensive sector-specific ESG questions
  const getSectorQuestions = (sector: string) => {

    switch (sector.toLowerCase()) {
      case 'hospitality':
        return {
          environmental: [
            {
              id: 10,
              question: 'Do you have a designated person responsible for sustainability efforts?',
              rationale: 'Dedicated leadership ensures ESG program effectiveness',
              frameworks: 'DST Carbon Calculator, Green Key 1.1',
              data_source: 'Job descriptions for sustainability roles',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 11,
              question: 'Do you track monthly electricity consumption from DEWA in kWh?',
              rationale: 'Energy tracking is fundamental for carbon footprint calculation',
              frameworks: 'DST Carbon Calculator, Green Key 7.1',
              data_source: 'Monthly utility bills (electricity, water, district cooling)',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 12,
              question: 'Do you measure waste sent to landfill each month?',
              rationale: 'Waste tracking is required for environmental compliance',
              frameworks: 'DST Carbon Calculator, Green Key 5.1',
              data_source: 'Waste contractor invoices/reports',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 13,
              question: 'Do you use bulk dispensers for toiletries in guest bathrooms?',
              rationale: 'Reduces single-use plastic consumption',
              frameworks: 'Green Key 5.2',
              data_source: 'Photos of equipment/facilities',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 14,
              question: 'Are at least 75% of your light bulbs energy-efficient models (LED)?',
              rationale: 'LED lighting significantly reduces energy consumption',
              frameworks: 'DST Mandatory, Green Key 7.2',
              data_source: 'Equipment specifications (LED lighting, generators)',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 15,
              question: 'Do you track total monthly water consumption in cubic meters?',
              rationale: 'Water conservation is critical for sustainability',
              frameworks: 'DST Carbon Calculator, Green Key 8.1',
              data_source: 'Monthly utility bills (electricity, water, district cooling)',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 20,
              question: 'Do you provide regular training for all staff on sustainability goals?',
              rationale: 'Employee awareness is crucial for ESG program success',
              frameworks: 'DST Mandatory, Green Key 2.1',
              data_source: 'Training records and materials',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 21,
              question: 'Do you have a program encouraging guests to reuse towels and linens?',
              rationale: 'Guest engagement reduces environmental impact',
              frameworks: 'Green Key 8.2, DST Optional',
              data_source: 'Photos of equipment/facilities',
              category: 'social',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 30,
              question: 'Do you have a written sustainability policy signed by senior management?',
              rationale: 'Formal policies demonstrate organizational commitment',
              frameworks: 'DST Mandatory, Green Key 1.2',
              data_source: 'Signed sustainability policy documents',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 31,
              question: 'Do you have a policy to give preference to local, organic, or fair-trade suppliers?',
              rationale: 'Sustainable procurement supports local economy',
              frameworks: 'Green Key 4.1, DST Optional',
              data_source: 'Purchasing policies',
              category: 'governance',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ]
        };

      case 'construction':
        return {
          environmental: [
            {
              id: 40,
              question: 'Are you pursuing green building certification (Al Sa\'fat, Estidama, LEED)?',
              rationale: 'Green building certification is mandatory for Dubai/Abu Dhabi projects',
              frameworks: 'Al Sa\'fat Mandatory Credits, Estidama Pearl Rating',
              data_source: 'Green building certification documents',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 41,
              question: 'Have you conducted an Environmental Impact Assessment (EIA)?',
              rationale: 'EIA is required for major construction projects',
              frameworks: 'Dubai Municipality Requirements, Federal EIA Law',
              data_source: 'Environmental Impact Assessment (EIA) reports',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 42,
              question: 'Do you have a Construction and Demolition (C&D) Waste Management Plan?',
              rationale: 'Waste management planning is mandatory for construction',
              frameworks: 'Al Sa\'fat Mandatory Credits, Dubai Municipality Requirements',
              data_source: 'C&D Waste Management Plan documents',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 43,
              question: 'Do you segregate construction waste on-site for recycling?',
              rationale: 'Waste segregation reduces landfill impact',
              frameworks: 'Al Sa\'fat Mandatory Credits, Dubai Municipality Requirements',
              data_source: 'Photos of segregation areas',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 44,
              question: 'Does your building design incorporate energy-reducing features?',
              rationale: 'Energy-efficient design reduces operational carbon footprint',
              frameworks: 'Al Sa\'fat Mandatory Credits, Estidama',
              data_source: 'Building design specifications, MEP drawings',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 45,
              question: 'Does the project plan include installing on-site renewable energy?',
              rationale: 'Renewable energy reduces grid dependency and emissions',
              frameworks: 'Al Sa\'fat Optional Credits, Dubai Clean Energy Strategy',
              data_source: 'Solar panel specifications, renewable energy plans',
              category: 'environmental',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 50,
              question: 'Do you have measures to control dust and air pollution?',
              rationale: 'Air quality protection is essential for community health',
              frameworks: 'Dubai Municipality Requirements, Federal Environmental Law',
              data_source: 'Monitoring reports',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 51,
              question: 'Are water-efficient fixtures installed in the building?',
              rationale: 'Water conservation is critical for sustainable development',
              frameworks: 'Al Sa\'fat Water Credits, Estidama',
              data_source: 'Fixture specifications, water efficiency certificates',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 52,
              question: 'Does the building have separate meters for different areas?',
              rationale: 'Sub-metering enables efficient resource management',
              frameworks: 'Al Sa\'fat Optional Credits, Green Building Guidelines',
              data_source: 'Metering plans, building management system setup',
              category: 'social',
              sector: sector,
              required: false,
              type: 'yes_no'
            }
          ],
          governance: [
            {
              id: 60,
              question: 'Do you use locally sourced or recycled materials in construction?',
              rationale: 'Local sourcing supports sustainability and economy',
              frameworks: 'Al Sa\'fat Optional Credits, Estidama',
              data_source: 'Material procurement records',
              category: 'governance',
              sector: sector,
              required: false,
              type: 'yes_no'
            },
            {
              id: 61,
              question: 'Does the building have dedicated recycling bins for occupants?',
              rationale: 'Waste infrastructure supports sustainable behaviors',
              frameworks: 'Al Sa\'fat Optional Credits, Dubai Municipality Guidelines',
              data_source: 'Photos of recycling facilities, waste management plan',
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
              question: 'Do you have a certified Environmental Management System (ISO 14001)?',
              rationale: 'ISO 14001 is the international standard for environmental management',
              frameworks: 'ISO 14001 Environmental Management, Federal Energy Management Regulation',
              data_source: 'ISO 14001 certificates, EMS documentation',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 71,
              question: 'Have you conducted an Environmental Impact Assessment for your facility?',
              rationale: 'EIA is required for industrial facilities to assess environmental impacts',
              frameworks: 'Federal Environmental Law, UAE Policy for Advanced Industries',
              data_source: 'Environmental Impact Assessment (EIA) reports',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 72,
              question: 'Do you track monthly consumption of all energy sources?',
              rationale: 'Energy tracking is fundamental for carbon footprint calculation',
              frameworks: 'Federal Energy Management Regulation, Federal Climate Law',
              data_source: 'Monthly utility bills, energy consumption data',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 73,
              question: 'Do you monitor air emissions from your stacks or vents?',
              rationale: 'Air quality monitoring is required for industrial operations',
              frameworks: 'Federal Environmental Law, Free Zone EHS Regulations',
              data_source: 'Air quality monitoring reports, stack emission data',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 74,
              question: 'Do you track types and quantities of industrial waste generated?',
              rationale: 'Waste tracking is essential for proper disposal and compliance',
              frameworks: 'Federal Environmental Law, Industrial Waste Management Regulations',
              data_source: 'Waste generation logs, disposal certificates',
              category: 'environmental',
              sector: sector,
              required: true,
              type: 'yes_no'
            }
          ],
          social: [
            {
              id: 80,
              question: 'Do you provide training and development programs for employees?',
              rationale: 'Employee development is a key social responsibility',
              frameworks: 'GRI 404-2, UAE Vision 2071',
              data_source: 'Training records, employee development plans',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 81,
              question: 'Do you have programs to reduce, reuse, or recycle waste materials?',
              rationale: 'Circular economy practices reduce environmental impact',
              frameworks: 'UAE Circular Economy Policy, Federal Climate Law',
              data_source: 'Waste reduction program documentation, recycling records',
              category: 'social',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 82,
              question: 'Do you treat your industrial wastewater before discharging?',
              rationale: 'Wastewater treatment protects water resources and public health',
              frameworks: 'Federal Water Law, Municipal Discharge Standards',
              data_source: 'Wastewater treatment reports, discharge permits',
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
              rationale: 'Proper hazardous waste disposal is legally required',
              frameworks: 'Federal Environmental Law, Hazardous Waste Regulations',
              data_source: 'Contractor licenses, hazardous waste disposal certificates',
              category: 'governance',
              sector: sector,
              required: true,
              type: 'yes_no'
            },
            {
              id: 91,
              question: 'Have you implemented energy efficiency improvement projects?',
              rationale: 'Energy efficiency reduces costs and environmental impact',
              frameworks: 'Federal Energy Management Regulation, UAE Green Agenda',
              data_source: 'Energy audit reports, efficiency project documentation',
              category: 'governance',
              sector: sector,
              required: false,
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
  const baseBusinessQuestions = [
    {
      id: 1,
      question: 'What is your company name?',
      rationale: 'Company identification for compliance tracking',
      frameworks: 'GRI 102-1',
      data_source: 'Business registration documents',
      category: 'business',
      sector: businessSector,
      required: true,
      type: 'text'
    },
    {
      id: 2,
      question: 'How many employees does your company have?',
      rationale: 'Company size determines applicable regulations',
      frameworks: 'GRI 102-7',
      data_source: 'HR records, employee roster',
      category: 'business',
      sector: businessSector,
      required: true,
      type: 'number'
    }
  ];

  const allQuestions = {
    'Business Info': baseBusinessQuestions,
    'Environmental': sectorQuestions.environmental,
    'Social': sectorQuestions.social,
    'Governance': sectorQuestions.governance
  };

  const mockScopingData: ESGScopingData = {
    sector: businessSector,
    total_questions: Object.values(allQuestions).flat().length,
    categories: ['Business Info', 'Environmental', 'Social', 'Governance'],
    questions_by_category: allQuestions,
    frameworks: getSectorFrameworks(businessSector)
  };

  // Use mock data instead of API call
  const scopingData = mockScopingData;
  const isLoading = false;
  const error = null;

  // Enhanced task generation logic with comprehensive framework tagging
  const generateTasksFromAnswers = (answers: Record<string, any>, sector: string) => {
    const generatedTasks: any[] = [];
    let taskIdCounter = 1;

    // Get all questions for the sector
    const sectorQuestions = getSectorQuestions(sector);
    const allQuestions = [
      ...baseBusinessQuestions,
      ...sectorQuestions.environmental,
      ...sectorQuestions.social,
      ...sectorQuestions.governance
    ];

    allQuestions.forEach((question) => {
      const answer = answers[question.id];
      const taskId = `task_${String(taskIdCounter).padStart(3, '0')}`;

      // Generate tasks based on "No" answers (compliance gaps)
      if (answer === 'no' && question.required) {
        const enhancedTaskData = generateEnhancedTask(question, answer, 'compliance');
        const task = {
          title: generateTaskTitle(question),
          description: generateTaskDescription(question),
          status: 'todo' as const,
          category: enhancedTaskData.category.toLowerCase() as 'environmental' | 'social' | 'governance',
          due_date: calculateDueDate(question.frameworks),
          assigned_user: 'Unassigned',
          evidence_count: 0,
          required_evidence: enhancedTaskData.evidenceRequired.length,
          
          // ESG-specific fields
          frameworks: enhancedTaskData.frameworks,
          priority: enhancedTaskData.priority,
          compliance_context: `This task addresses a compliance gap identified in your ESG assessment. ${question.rationale}`,
          action_required: `Complete the following: ${question.question.replace(/^Do you /, '')}. Required evidence: ${enhancedTaskData.evidenceRequired.join(', ')}`,
          framework_tags: enhancedTaskData.frameworks,
          evidence_required: enhancedTaskData.evidenceRequired,
          created_from_assessment: true,
          sector: enhancedTaskData.sector,
          estimated_hours: enhancedTaskData.estimatedHours,
          compliance_level: enhancedTaskData.complianceLevel,
          regulatory_requirement: isRegulatoryRequirement(question.frameworks),
          task_type: 'compliance' as const,
          created_at: new Date().toISOString(),
          audit_trail: {
            created_at: new Date().toISOString(),
            question_id: question.id,
            answer: answer,
            triggered_by: 'compliance_gap'
          }
        };
        generatedTasks.push(task);
        taskIdCounter++;
      }

      // Generate monitoring tasks for "Yes" answers that require ongoing tracking
      if (answer === 'yes' && isOngoingTrackingRequired(question)) {
        const enhancedTaskData = generateEnhancedTask(question, answer, 'monitoring');
        const task = {
          title: generateOngoingTaskTitle(question),
          description: generateOngoingTaskDescription(question),
          status: 'todo' as const,
          category: enhancedTaskData.category.toLowerCase() as 'environmental' | 'social' | 'governance',
          due_date: calculateOngoingDueDate(),
          assigned_user: 'Unassigned',
          evidence_count: 0,
          required_evidence: enhancedTaskData.evidenceRequired.length,
          
          // ESG-specific fields
          frameworks: enhancedTaskData.frameworks,
          priority: 'Medium',
          compliance_context: `This task ensures ongoing monitoring of your current ESG practices. ${question.rationale}`,
          action_required: `Maintain regular monitoring: ${question.question.replace(/^Do you /, '')}. Document evidence: ${enhancedTaskData.evidenceRequired.join(', ')}`,
          framework_tags: enhancedTaskData.frameworks,
          evidence_required: enhancedTaskData.evidenceRequired,
          created_from_assessment: true,
          sector: enhancedTaskData.sector,
          estimated_hours: enhancedTaskData.estimatedHours,
          compliance_level: enhancedTaskData.complianceLevel,
          regulatory_requirement: isRegulatoryRequirement(question.frameworks),
          task_type: 'monitoring' as const,
          created_at: new Date().toISOString(),
          audit_trail: {
            created_at: new Date().toISOString(),
            question_id: question.id,
            answer: answer,
            triggered_by: 'ongoing_monitoring'
          }
        };
        generatedTasks.push(task);
        taskIdCounter++;
      }

      // Generate improvement tasks for optional requirements answered "No"
      if (answer === 'no' && !question.required) {
        const enhancedTaskData = generateEnhancedTask(question, answer, 'compliance');
        const task = {
          title: `[Optional] ${generateTaskTitle(question)}`,
          description: `${generateTaskDescription(question)}\n\nNote: This is an optional improvement that can enhance your ESG performance.`,
          status: 'todo' as const,
          category: enhancedTaskData.category.toLowerCase() as 'environmental' | 'social' | 'governance',
          due_date: calculateDueDate(question.frameworks, true), // Extended deadline for optional tasks
          assigned_user: 'Unassigned',
          evidence_count: 0,
          required_evidence: enhancedTaskData.evidenceRequired.length,
          
          // ESG-specific fields
          frameworks: enhancedTaskData.frameworks,
          priority: 'Low',
          compliance_context: `This task represents an optional improvement opportunity identified in your ESG assessment. ${question.rationale}`,
          action_required: `Consider implementing: ${question.question.replace(/^Do you /, '')}. This would enhance your ESG performance. Evidence needed: ${enhancedTaskData.evidenceRequired.join(', ')}`,
          framework_tags: enhancedTaskData.frameworks,
          evidence_required: enhancedTaskData.evidenceRequired,
          created_from_assessment: true,
          sector: enhancedTaskData.sector,
          estimated_hours: enhancedTaskData.estimatedHours,
          compliance_level: enhancedTaskData.complianceLevel,
          regulatory_requirement: false,
          task_type: 'improvement' as const,
          created_at: new Date().toISOString(),
          audit_trail: {
            created_at: new Date().toISOString(),
            question_id: question.id,
            answer: answer,
            triggered_by: 'improvement_opportunity'
          }
        };
        generatedTasks.push(task);
        taskIdCounter++;
      }
    });

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
  const getEvidenceRequirements = (question: ESGQuestion) => {
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

      // Energy & Emissions Evidence
      'electricity consumption': [
        'Monthly DEWA electricity bills',
        'Energy consumption tracking spreadsheet',
        'Meter reading logs',
        'Building management system (BMS) data'
      ],
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

    for (const [keyword, requirements] of Object.entries(evidenceMap)) {
      if (questionLower.includes(keyword)) {
        evidenceRequirements = requirements;
        break;
      }
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
  const generateEnhancedTask = (question: ESGQuestion, answer: string, taskType: 'compliance' | 'monitoring') => {
    const evidenceRequirements = getEvidenceRequirements(question);
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
    mutationFn: (data: any) => {
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
      const answeredQuestions = Object.keys(data.answers).length;
      const yesAnswers = Object.values(data.answers).filter(answer => answer === 'yes').length;
      const noAnswers = Object.values(data.answers).filter(answer => answer === 'no').length;
      
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

      // Mock API call - just return the data after a short delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data: completeData });
        }, 1000);
      });
    },
    onSuccess: (data) => {
      console.log('ESG Scoping completed with comprehensive analytics:', data);
      
      // Save results to localStorage for the results page
      localStorage.setItem('assessmentResults', JSON.stringify(data.data));
      
      // Navigate to results page
      navigate('/assessment/results');
      
      // Also call the original onComplete callback
      onComplete(data);
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
  const totalAnswered = Object.keys(answers).length;
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
      fontSize: '0.875rem'
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
              {currentCategory + 1}/4
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
          const categoryIcons = ['🏢', '🌱', '👥', '⚖️'] // Business, Environmental, Social, Governance
          
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
          {['🏢', '🌱', '👥', '⚖️'][currentCategory] || '📋'}
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
          
          {/* Test button for development */}
          <button
            onClick={() => {
              // Generate some real test tasks
              const testAnswers = {
                10: 'no', // No sustainability person
                11: 'no', // No energy tracking
                12: 'no', // No waste tracking
                20: 'yes', // Yes to staff training
                30: 'no', // No sustainability policy
              };
              
              const testGeneratedTasks = generateTasksFromAnswers(testAnswers, businessSector);
              const savedTasks = taskStorage.addTasks(testGeneratedTasks);
              
              const testResults = {
                sector: businessSector,
                completedAt: new Date().toISOString(),
                overallESGScore: 67,
                categoryScores: { environmental: 70, social: 65, governance: 66 },
                totalTasksGenerated: savedTasks.length,
                highPriorityTasks: savedTasks.filter(t => t.priority === 'High').length,
                mediumPriorityTasks: savedTasks.filter(t => t.priority === 'Medium').length,
                lowPriorityTasks: savedTasks.filter(t => t.priority === 'Low').length,
                complianceTasks: savedTasks.filter(t => t.task_type === 'compliance').length,
                monitoringTasks: savedTasks.filter(t => t.task_type === 'monitoring').length,
                improvementTasks: savedTasks.filter(t => t.task_type === 'improvement').length,
                regulatoryTasks: savedTasks.filter(t => t.regulatory_requirement).length,
                totalEstimatedHours: savedTasks.reduce((sum, t) => sum + t.estimated_hours, 0),
                estimatedCompletionWeeks: Math.ceil(savedTasks.reduce((sum, t) => sum + t.estimated_hours, 0) / 40),
                complianceRate: 58,
                frameworkCoverage: {
                  totalFrameworks: 6,
                  activeFrameworks: ['DST', 'Green Key', 'GRI Standards'],
                  coveragePercentage: 50
                },
                carbonTrackingReadiness: {
                  readinessScore: 40,
                  trackingCapabilities: 2,
                  recommendations: ['Implement energy monitoring systems', 'Set up monthly data collection']
                },
                applicableFrameworks: getSectorFrameworks(businessSector),
                generatedTasks: savedTasks
              };
              
              localStorage.setItem('assessmentResults', JSON.stringify(testResults));
              window.dispatchEvent(new CustomEvent('tasksUpdated'));
              navigate('/assessment/results');
            }}
            style={{...dashboardStyles.button, backgroundColor: '#f59e0b', color: 'white'}}
          >
            <span>🧪</span>
            <span>Test with Real Tasks</span>
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