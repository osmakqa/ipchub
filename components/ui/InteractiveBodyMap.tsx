import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Hand, 
  User, 
  BicepsFlexed, 
  Footprints,
  UserCircle,
  Watch,
  Heart,
  Activity,
  CircleDot,
  Pointer
} from 'lucide-react';

interface Props {
  onSelect: (code: string, description: string) => void;
  selectedCode?: string;
}

interface BodyPart {
  id: string;
  label: string;
  icon?: React.ReactNode;
  code?: number; // EPINet Code
  children?: BodyPart[];
}

// --- DATA HIERARCHY MAPPED TO EPINet CODES ---
const BODY_DATA: BodyPart[] = [
  {
    id: 'hands',
    label: 'Hands & Fingers',
    icon: <Hand size={32} />,
    children: [
      {
        id: 'hand_right',
        label: 'Right Hand',
        icon: <Hand size={24} />,
        children: [
          {
            id: 'fingers_r',
            label: 'Fingers (Right)',
            icon: <Pointer size={24} />,
            children: [
              { id: 'thumb_r_tip', label: 'Thumb Tip (R)', code: 3 },
              { id: 'thumb_r_base', label: 'Thumb Base (R)', code: 2 },
              { id: 'index_r_tip', label: 'Index Tip (R)', code: 4 },
              { id: 'index_r_base', label: 'Index Base (R)', code: 5 },
              { id: 'middle_r_tip', label: 'Middle Tip (R)', code: 10 },
              { id: 'middle_r_base', label: 'Middle Base (R)', code: 11 },
              { id: 'ring_r', label: 'Ring Finger (R)', code: 12 },
              { id: 'little_r', label: 'Little Finger (R)', code: 9 },
            ]
          },
          {
            id: 'palm_r',
            label: 'Palm / Dorsal (Right)',
            icon: <Hand size={24} />,
            children: [
              { id: 'palm_r_center', label: 'Palm Center (R)', code: 7 },
              { id: 'palm_r_thenar', label: 'Thenar (Thumb pad)', code: 6 },
              { id: 'palm_r_hypo', label: 'Hypothenar (Side)', code: 13 },
              { id: 'hand_r_dorsal', label: 'Back of Hand (Dorsal)', code: 1 },
            ]
          }
        ]
      },
      {
        id: 'hand_left',
        label: 'Left Hand',
        icon: <Hand size={24} />,
        children: [
          {
            id: 'fingers_l',
            label: 'Fingers (Left)',
            icon: <Pointer size={24} />,
            children: [
              { id: 'thumb_l_tip', label: 'Thumb Tip (L)', code: 17 },
              { id: 'thumb_l_base', label: 'Thumb Base (L)', code: 18 },
              { id: 'index_l_tip', label: 'Index Tip (L)', code: 19 },
              { id: 'index_l_base', label: 'Index Base (L)', code: 20 },
              { id: 'middle_l_tip', label: 'Middle Tip (L)', code: 24 },
              { id: 'middle_l_base', label: 'Middle Base (L)', code: 25 },
              { id: 'ring_l', label: 'Ring Finger (L)', code: 26 },
              { id: 'little_l', label: 'Little Finger (L)', code: 23 },
            ]
          },
          {
            id: 'palm_l',
            label: 'Palm / Dorsal (Left)',
            icon: <Hand size={24} />,
            children: [
              { id: 'palm_l_center', label: 'Palm Center (L)', code: 21 },
              { id: 'palm_l_thenar', label: 'Thenar (Thumb pad)', code: 16 },
              { id: 'palm_l_hypo', label: 'Hypothenar (Side)', code: 22 },
              { id: 'hand_l_dorsal', label: 'Back of Hand (Dorsal)', code: 15 },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'arms',
    label: 'Arms',
    icon: <BicepsFlexed size={32} />,
    children: [
      {
        id: 'arm_right',
        label: 'Right Arm',
        icon: <BicepsFlexed size={24} />,
        children: [
          { id: 'arm_r_upper', label: 'Upper Arm (R)', code: 32, icon: <BicepsFlexed size={20} /> },
          { id: 'arm_r_fore', label: 'Forearm (R)', code: 31, icon: <BicepsFlexed size={18} className="opacity-70" /> },
          { id: 'arm_r_wrist', label: 'Wrist (R)', code: 30, icon: <Watch size={20} /> },
        ]
      },
      {
        id: 'arm_left',
        label: 'Left Arm',
        icon: <BicepsFlexed size={24} />,
        children: [
          { id: 'arm_l_upper', label: 'Upper Arm (L)', code: 45, icon: <BicepsFlexed size={20} /> },
          { id: 'arm_l_fore', label: 'Forearm (L)', code: 46, icon: <BicepsFlexed size={18} className="opacity-70" /> },
          { id: 'arm_l_wrist', label: 'Wrist (L)', code: 47, icon: <Watch size={20} /> },
        ]
      }
    ]
  },
  {
    id: 'torso',
    label: 'Torso & Head',
    icon: <User size={32} />,
    children: [
      {
        id: 'head',
        label: 'Head & Neck',
        icon: <UserCircle size={28} />,
        children: [
           { id: 'face_r', label: 'Face (Right)', code: 33, icon: <UserCircle size={20} /> },
           { id: 'face_l', label: 'Face (Left)', code: 39, icon: <UserCircle size={20} /> },
           { id: 'head_back', label: 'Back of Head', code: 51, icon: <UserCircle size={20} className="opacity-50" /> },
        ]
      },
      {
        id: 'front_body',
        label: 'Front Torso',
        icon: <Heart size={28} />,
        children: [
          { id: 'chest_r', label: 'Chest (Right)', code: 34, icon: <Heart size={20} /> },
          { id: 'chest_l', label: 'Chest (Left)', code: 40, icon: <Heart size={20} /> },
          { id: 'abd_r', label: 'Abdomen (Right)', code: 35, icon: <Activity size={20} /> },
          { id: 'abd_l', label: 'Abdomen (Left)', code: 41, icon: <Activity size={20} /> },
        ]
      },
      {
        id: 'back_body',
        label: 'Back Torso',
        icon: <User size={28} className="rotate-180" />,
        children: [
          { id: 'back_up', label: 'Upper Back', code: 52, icon: <CircleDot size={20} /> },
          { id: 'back_low', label: 'Lower Back', code: 53, icon: <CircleDot size={20} /> },
          { id: 'buttock', label: 'Buttocks', code: 54, icon: <CircleDot size={20} /> },
        ]
      }
    ]
  },
  {
    id: 'legs',
    label: 'Legs & Feet',
    icon: <Footprints size={32} />,
    children: [
       {
        id: 'leg_r',
        label: 'Right Leg',
        icon: <Footprints size={24} />,
        children: [
           { id: 'thigh_r', label: 'Thigh (R)', code: 36, icon: <BicepsFlexed size={20} className="rotate-90" /> },
           { id: 'leg_low_r', label: 'Lower Leg (R)', code: 37, icon: <Footprints size={20} /> },
           { id: 'foot_r', label: 'Foot (R)', code: 38, icon: <Footprints size={20} /> },
        ]
       },
       {
        id: 'leg_l',
        label: 'Left Leg',
        icon: <Footprints size={24} />,
        children: [
           { id: 'thigh_l', label: 'Thigh (L)', code: 42, icon: <BicepsFlexed size={20} className="rotate-90" /> },
           { id: 'leg_low_l', label: 'Lower Leg (L)', code: 43, icon: <Footprints size={20} /> },
           { id: 'foot_l', label: 'Foot (L)', code: 44, icon: <Footprints size={20} /> },
        ]
       }
    ]
  }
];

const InteractiveBodyMap: React.FC<Props> = ({ onSelect, selectedCode }) => {
  const [history, setHistory] = useState<BodyPart[]>([]);
  const [currentView, setCurrentView] = useState<BodyPart[]>(BODY_DATA);
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  const handleSelect = (item: BodyPart) => {
    if (item.children) {
      setHistory([...history, { ...item, children: [] }]); // Store parent in history
      setCurrentView(item.children);
    } else if (item.code) {
      // It's a leaf node
      onSelect(item.code.toString(), item.label);
      setSelectedLabel(item.label);
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    
    const newHistory = [...history];
    newHistory.pop(); // Remove current parent
    setHistory(newHistory);

    // Navigate logic
    if (newHistory.length === 0) {
      setCurrentView(BODY_DATA);
    } else {
      // Find the children of the last item in history to display
      let nextView = BODY_DATA;
      for (const step of newHistory) {
         const found = nextView.find(i => i.id === step.id);
         if (found && found.children) {
            nextView = found.children;
         }
      }
      setCurrentView(nextView);
    }
  };

  const handleReset = () => {
    setHistory([]);
    setCurrentView(BODY_DATA);
    setSelectedLabel('');
    onSelect('', '');
  };

  const currentParent = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="flex flex-col gap-4 w-full">
      
      {/* Selection Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCode ? 'bg-[var(--osmak-green)] text-white' : 'bg-gray-200 text-gray-400'}`}>
            {selectedCode ? <Check size={20} /> : <User size={20} />}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Selected Location</span>
            <span className="font-semibold text-gray-800">
              {selectedCode 
                ? `${selectedLabel || 'Item Selected'} (Code: ${selectedCode})` 
                : 'No location selected'}
            </span>
          </div>
        </div>
        {selectedCode && (
          <button 
            onClick={handleReset}
            className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
          >
            Change
          </button>
        )}
      </div>

      {/* Drill Down Interface */}
      {!selectedCode && (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header / Breadcrumb */}
          <div className="bg-gray-100 p-3 flex items-center gap-2 border-b border-gray-200">
            {history.length > 0 ? (
              <button 
                onClick={handleBack} 
                className="flex items-center text-sm font-semibold text-gray-600 hover:text-[var(--osmak-green)] transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide px-1">Select Body Region</span>
            )}
            
            {history.length > 0 && (
              <div className="flex items-center text-sm text-gray-400">
                 <span className="mx-2">|</span>
                 <span className="text-[var(--osmak-green-dark)] font-bold">{currentParent?.label}</span>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {currentView.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-gray-100 bg-gray-50 hover:bg-green-50 hover:border-[var(--osmak-green)] hover:shadow-md transition-all group h-32"
              >
                <div 
                  className="text-gray-400 group-hover:text-[var(--osmak-green)] transition-all"
                  style={{ transform: item.id.includes('_l') ? 'scaleX(-1)' : 'none' }}
                >
                  {item.icon || (
                    <div className="w-8 h-8 rounded-full border-2 border-current opacity-50 flex items-center justify-center">
                      <div className="w-2 h-2 bg-current rounded-full" />
                    </div>
                  )}
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-[var(--osmak-green-dark)] text-center text-xs sm:text-sm">
                  {item.label}
                </span>
                {item.children && <ChevronRight size={14} className="text-gray-300 group-hover:text-[var(--osmak-green)]" />}
              </button>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
             {history.length === 0 ? "Step 1: Choose Region" : history.length === 1 ? "Step 2: Narrow Down" : "Step 3: Specific Part"}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveBodyMap;