# Step 2: Locations & Facilities - ESG Data Wizard

## Overview
This step captures the company's operational footprint, including multiple locations, sub-buildings, and utility infrastructure to ensure accurate ESG data collection and compliance tracking.

## Location Hierarchy Structure

### Primary Questions

#### 1. **Multiple Locations Assessment**
**Question:** "Does your company operate from multiple locations or sites?"
- **Options:** Yes / No
- **Logic:** If "No" → Skip to single location setup
- **Logic:** If "Yes" → Continue to multi-location flow

#### 2. **Location Count**
**Question:** "How many operational locations does your company have?"
- **Options:** 
  - 2-5 locations
  - 6-10 locations
  - 11-25 locations
  - 25+ locations
- **Logic:** Determines interface complexity (simple list vs. bulk import)

### For Each Location

#### 3. **Location Basic Information**
```
Location Name: [Text Input]
Address: [Text Input with Emirate dropdown]
- Dubai
- Abu Dhabi
- Sharjah
- Ajman
- Ras Al Khaimah
- Fujairah
- Umm Al Quwain

Location Type: [Dropdown]
- Head Office
- Branch Office
- Manufacturing Facility
- Warehouse/Distribution Center
- Retail Store
- Hotel/Resort
- Construction Site
- Educational Campus
- Healthcare Facility
- Other (specify)
```

#### 4. **Facility Size & Scope**
**Question:** "What is the total floor area of this location?"
- **Input:** Numerical input + unit selector (sqm/sqft)
- **Purpose:** Determines applicable building regulations (Al Sa'fat, Estidama)

**Question:** "How many employees work at this location?"
- **Input:** Numerical input
- **Purpose:** Determines social compliance requirements

#### 5. **Sub-Building/Zone Structure**
**Question:** "Is this location divided into separate buildings, zones, or operational areas?"
- **Options:** Yes / No
- **If Yes:** "How many separate buildings/zones are there?"
  - **Input:** Numerical input (1-50)
  - **Logic:** Generate sub-building forms

### For Each Sub-Building/Zone

#### 6. **Sub-Building Details**
```
Building/Zone Name: [Text Input]
- e.g., "Main Office Building", "Production Hall A", "Warehouse Block 2"

Function/Purpose: [Dropdown]
- Administrative Offices
- Manufacturing/Production
- Storage/Warehouse
- Retail/Customer Service
- Research & Development
- Maintenance/Utilities
- Accommodation/Dormitory
- Food Service/Kitchen
- Other (specify)

Floor Area: [Numerical Input + Unit]
Occupancy: [Number of people]
```

## Utility Infrastructure Mapping

### 7. **Electricity Metering**
**Question:** "Does this [location/building] have its own separate electricity meter?"
- **Options:** Yes / No / Shared / Unknown

**If Separate Meter:**
```
Meter Number: [Text Input]
Utility Provider: [Dropdown]
- DEWA (Dubai)
- ADWEA (Abu Dhabi)
- SEWA (Sharjah)
- FEWA (Northern Emirates)
- Private/Other

Monthly Average Consumption: [Numerical + kWh]
```

**If Shared Meter:**
```
Shared with: [Multi-select from other buildings]
Estimated % of Total Usage: [Percentage input]
Allocation Method: [Dropdown]
- By floor area
- By occupancy
- By equipment load
- Equal division
- Other method
```

### 8. **Water Metering**
**Question:** "Does this [location/building] have its own separate water meter?"
- **Similar structure to electricity metering**
- **Units:** Cubic meters (m³) or gallons
- **Include:** Municipal water, desalinated water, groundwater sources

### 9. **District Cooling/Heating**
**Question:** "Does this location use district cooling or centralized HVAC systems?"
- **Options:** Yes / No / Partial
- **If Yes:** Separate metering details and provider information

### 10. **Specialized Utilities** (Sector-Specific)

#### For Manufacturing:
- **Natural Gas:** Separate metering, consumption tracking
- **Compressed Air:** Central vs. local generation
- **Steam/Thermal:** Boiler systems and distribution

#### For Healthcare:
- **Medical Gas Systems:** Oxygen, nitrogen, medical air
- **Emergency Power:** Generator systems and fuel tracking
- **Specialized Waste:** Medical waste generation points

#### For Hospitality:
- **Kitchen Gas:** LPG systems and consumption
- **Pool Systems:** Water treatment and heating
- **Laundry Facilities:** Steam and hot water systems

## Jurisdiction & Compliance Mapping

### 11. **Regulatory Jurisdiction**
**Auto-populated based on Emirate selection:**

**Dubai Locations:**
- Dubai Municipality regulations
- Al Sa'fat green building requirements
- Dubai Sustainable Tourism (if hospitality)
- DEWA utility regulations

**Abu Dhabi Locations:**
- Abu Dhabi Municipality regulations
- Estidama Pearl rating requirements
- Department of Health sustainability goals (if healthcare)
- ADWEA utility regulations

**Other Emirates:**
- Federal regulations only
- Local municipality requirements
- Utility provider specifications

### 12. **Free Zone Considerations**
**Question:** "Is this location within a free zone?"
- **Options:** Yes / No
- **If Yes:** [Dropdown of major free zones]
  - JAFZA (Jebel Ali)
  - DMCC (Dubai Multi Commodities Centre)
  - ADGM (Abu Dhabi Global Market)
  - RAKEZ (Ras Al Khaimah Economic Zone)
  - Other (specify)

**Purpose:** Determines applicable EHS regulations and reporting requirements

## Data Validation & Logic

### Validation Rules:
1. **Total floor area** across sub-buildings cannot exceed main location area
2. **Employee count** across sub-buildings cannot exceed main location count
3. **Utility percentages** for shared meters must sum to 100%
4. **Mandatory fields** based on sector and location type

### Smart Defaults:
1. **Auto-suggest** building names based on function
2. **Pre-populate** utility providers based on emirate
3. **Estimate** consumption based on floor area and sector benchmarks
4. **Flag** locations requiring specific certifications

## Output Data Structure

```javascript
const locationData = {
  hasMultipleLocations: true,
  totalLocations: 3,
  locations: [
    {
      id: "loc_001",
      name: "Dubai Head Office",
      address: "Sheikh Zayed Road, Dubai",
      emirate: "Dubai",
      locationType: "Head Office",
      totalFloorArea: 2500,
      totalEmployees: 150,
      hasSubBuildings: true,
      subBuildings: [
        {
          id: "sub_001",
          name: "Main Office Tower",
          function: "Administrative Offices",
          floorArea: 2000,
          occupancy: 120,
          utilities: {
            electricity: {
              separateMeter: true,
              meterNumber: "DUB001234",
              provider: "DEWA",
              monthlyAvgConsumption: 15000
            },
            water: {
              separateMeter: true,
              meterNumber: "W001234",
              provider: "DEWA",
              monthlyAvgConsumption: 500
            }
          }
        }
      ],
      jurisdiction: {
        emirate: "Dubai",
        municipality: "Dubai Municipality",
        freeZone: null,
        applicableFrameworks: ["Al Sa'fat", "Dubai Municipality Regulations"]
      }
    }
  ]
}
```

## Task Generation Impact

Based on location data, the system will:

1. **Generate location-specific tasks** for each site
2. **Apply jurisdiction-specific requirements** (Dubai vs. Abu Dhabi regulations)
3. **Create utility tracking tasks** for each metered service
4. **Assign compliance deadlines** based on local authority requirements
5. **Calculate aggregated metrics** across all locations for dashboard

## User Experience Considerations

### Progressive Disclosure:
- Start with simple questions, reveal complexity gradually
- Show progress indicators for multi-location setup
- Allow save and continue later for complex configurations

### Bulk Import Option:
- For companies with 10+ locations
- Excel template with required fields
- Data validation and error reporting

### Visual Mapping:
- Interactive map showing all locations
- Color coding by compliance status
- Quick overview of utility infrastructure

This approach ensures comprehensive data collection while maintaining usability for companies ranging from single-location SMEs to multi-site enterprises.