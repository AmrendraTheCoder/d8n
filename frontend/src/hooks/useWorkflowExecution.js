import { useCallback } from "react";

// Default to localhost if env variable not set
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const useWorkflowExecution = () => {
  const executeWorkflow = useCallback(
    async (
      nodes,
      edges,
      workflowName,
      walletAddress,
      workflowType = "once"
    ) => {
      const workflowData = {
        walletaddr: walletAddress,
        type: workflowType,
        name: workflowName,
        nodes: {},
        edges: {},
      };

      nodes.forEach((node) => {
        workflowData.nodes[node.id] = {
          position: node.position,
          label: node.data.label,
          type: node.data.type,
          node_data: node.data.node_data,
          inputs: node.data.inputs,
          outputs: node.data.outputs,
        };
      });

      edges.forEach((edge) => {
        if (!workflowData.edges[edge.source])
          workflowData.edges[edge.source] = {};
        if (!workflowData.edges[edge.source][edge.target])
          workflowData.edges[edge.source][edge.target] = {};
        workflowData.edges[edge.source][edge.target][edge.sourceHandle] =
          edge.targetHandle;
      });

      console.log("Executing Workflow:", JSON.stringify(workflowData, null, 2));
      console.log("API URL:", API_URL);

      try {
        const response = await fetch(`${API_URL}/workflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ json_workflow: workflowData }),
        });

        // Check if response has content
        const text = await response.text();
        if (!text) {
          throw new Error("Server returned empty response. Is the engine running on " + API_URL + "?");
        }

        let result;
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
          throw new Error(result.message || result.error || "Failed to execute workflow");
        }

        alert(`Workflow executed successfully!`);
        console.log("Execution result:", result);
        return result;
      } catch (error) {
        console.error("Error executing workflow:", error);
        
        // Provide helpful error messages
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          alert(`Cannot connect to engine at ${API_URL}. Make sure the engine is running with 'npm start' in the d8n directory.`);
        } else {
          alert(`Error executing workflow: ${error.message}`);
        }
        throw error;
      }
    },
    []
  );

  return { executeWorkflow };
};

