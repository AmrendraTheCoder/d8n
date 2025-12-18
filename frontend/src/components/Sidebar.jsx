import React, { useState } from "react";
import {
  Cloud,
  GitBranch,
  Repeat,
  Bug,
  Play,
  FileText,
  Send,
  Target,
  Wallet,
  Lock,
  List,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";
import TemplateModal from "./TemplateModal";

const defiNodes = [
  { type: "pyth-network", label: "Pyth Price Feed", icon: <Cloud size={18} /> },
  { type: "limitOrder", label: "1inch Limit Order", icon: <Target size={18} /> },
  { type: "queryBalance", label: "Query Balance", icon: <Wallet size={18} /> },
  { type: "sendToken", label: "Send Token", icon: <Send size={18} /> },
  { type: "condition", label: "Condition", icon: <GitBranch size={18} /> },
  { type: "swap", label: "Swap", icon: <Repeat size={18} /> },
  { type: "print", label: "Print Debug", icon: <Bug size={18} /> },
];

const nexusNodes = [
  { type: "nexusPay", label: "Nexus Pay (402 API)", icon: <Lock size={18} />, accent: "purple" },
  { type: "registryQuery", label: "Service Registry", icon: <List size={18} />, accent: "blue" },
];

function CollapsibleSection({ title, icon, children, defaultOpen = true, accentColor = "slate" }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full p-2 rounded-lg text-left transition-colors hover:bg-${accentColor}-50`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="pt-2 space-y-1.5">{children}</div>
      </div>
    </div>
  );
}

function NodeButton({ node, onAdd }) {
  const accentStyles = {
    purple: "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700",
    blue: "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700",
    default: "hover:bg-blue-50 hover:border-blue-400",
  };

  const style = accentStyles[node.accent] || accentStyles.default;

  return (
    <button
      onClick={() => onAdd(node.type)}
      className={`flex items-center gap-2.5 p-2.5 w-full text-left bg-white border border-slate-200 rounded-lg transition-all duration-150 group ${style}`}
    >
      <span className={`text-slate-500 group-hover:scale-110 transition-transform ${node.accent === "purple" ? "text-purple-500" : node.accent === "blue" ? "text-blue-500" : "text-blue-500"
        }`}>
        {node.icon}
      </span>
      <span className="text-sm font-medium text-slate-700">{node.label}</span>
    </button>
  );
}

export default function Sidebar({
  onAddNode,
  onExecuteWorkflow,
  onLoadTemplate,
}) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handleLoadTemplate = (template) => {
    onLoadTemplate(template);
    setIsTemplateModalOpen(false);
  };

  return (
    <>
      <aside className="w-64 bg-gradient-to-b from-slate-50 to-white p-4 border-r border-slate-200 flex flex-col overflow-y-auto">
        {/* DeFi Nodes Section */}
        <CollapsibleSection
          title="DeFi Nodes"
          icon={<Zap size={16} className="text-amber-500" />}
          defaultOpen={true}
        >
          {defiNodes.map((node) => (
            <NodeButton key={node.type} node={node} onAdd={onAddNode} />
          ))}
        </CollapsibleSection>

        {/* Nexus Nodes Section */}
        <CollapsibleSection
          title="Nexus Nodes"
          icon={<Lock size={16} className="text-purple-500" />}
          defaultOpen={true}
          accentColor="purple"
        >
          {nexusNodes.map((node) => (
            <NodeButton key={node.type} node={node} onAdd={onAddNode} />
          ))}
        </CollapsibleSection>

        {/* Templates Section */}
        <CollapsibleSection
          title="Templates"
          icon={<FileText size={16} className="text-green-500" />}
          defaultOpen={false}
        >
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-2.5 p-2.5 w-full text-left bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:border-green-400 hover:shadow-sm transition-all duration-150"
          >
            <span className="text-green-500">
              <FileText size={18} />
            </span>
            <span className="text-sm font-medium text-slate-700">
              Browse Templates
            </span>
          </button>
        </CollapsibleSection>

        {/* Execute Button - Sticky at bottom */}
        <div className="mt-auto pt-4 border-t border-slate-200">
          <button
            onClick={onExecuteWorkflow}
            className="flex items-center justify-center gap-2 p-3 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transition-all duration-150 group"
          >
            <Play size={18} className="group-hover:scale-110 transition-transform" />
            <span>Execute Workflow</span>
          </button>
        </div>
      </aside>

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onLoadTemplate={handleLoadTemplate}
      />
    </>
  );
}
