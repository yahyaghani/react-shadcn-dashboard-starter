'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PageHead from '@/components/shared/page-head.jsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs.js';
import RecentSales from './components/recent-sales.js';
import PDFViewer from './components/PDFViewer'; // Import the PDFViewer component

// API endpoint configuration
const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export default function DashboardPage() {
  const [query, setQuery] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState('IDLE');
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [lastUpdateIndex, setLastUpdateIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const pollingIntervalRef = useRef(null);
  const updateContainerRef = useRef(null);
  const currentTaskIdRef = useRef(null); // Add a ref to track the current task ID

  // Debug state to check what we're receiving
  const [debugInfo, setDebugInfo] = useState(null);

  // Scroll to bottom of updates automatically
  useEffect(() => {
    if (updateContainerRef.current) {
      updateContainerRef.current.scrollTop =
        updateContainerRef.current.scrollHeight;
    }
  }, [updates]);

  // Function to start the agent task
  const startAgentTask = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    try {
      // Stop any existing polling first
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      setLoading(true);
      setError(null);
      setResult(null);
      setUpdates([]);
      setLastUpdateIndex(0);
      setDebugInfo(null);
      setTaskStatus('IDLE');

      const response = await axios.post(`${API_BASE_URL}/api/agent/run`, {
        query
      });

      const newTaskId = response.data.task_id;
      setTaskId(newTaskId);
      currentTaskIdRef.current = newTaskId; // Store the task ID in the ref
      setTaskStatus('STARTED');

      // Add the initial update to show the task has started
      setUpdates([
        {
          status: 'STARTED',
          message: `Task started for query: ${query}`,
          timestamp: new Date().toISOString(),
          step_type: 'setup'
        }
      ]);

      // Start polling for updates
      startPolling(newTaskId);
    } catch (err) {
      setError(`Error starting agent task: ${err.message}`);
      setLoading(false);
    }
  };

  // Function to start polling for updates
  const startPolling = (id) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Ensure we're tracking the correct task ID
    currentTaskIdRef.current = id;

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchUpdates(id);
    }, 2000); // Poll every 2 seconds

    console.log(`Started polling for task ID: ${id}`);
  };

  // Function to fetch updates from the API
  const fetchUpdates = async (id) => {
    try {
      // Verify this is still the current task
      if (id !== currentTaskIdRef.current) {
        console.log(
          `Task ID mismatch: ${id} vs current ${currentTaskIdRef.current}, stopping polling`
        );
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/agent/updates/${id}?since=${lastUpdateIndex}`
      );

      if (response.data.status === 'SUCCESS') {
        // Add new updates if there are any
        if (response.data.updates && response.data.updates.length > 0) {
          // Use the functional form to ensure we're working with the latest state
          setUpdates((prevUpdates) => [
            ...prevUpdates,
            ...response.data.updates
          ]);
          setLastUpdateIndex(response.data.total);

          // Store for debugging
          setDebugInfo((prev) => ({
            ...prev,
            lastResponse: response.data,
            updateCount: response.data.total,
            currentTaskId: currentTaskIdRef.current
          }));
        }

        // Check if the task is complete
        const taskStatusResponse = await axios.get(
          `${API_BASE_URL}/api/agent/status/${id}`
        );

        // Verify this is still for the current task
        if (id !== currentTaskIdRef.current) {
          console.log(
            `Task ID changed during status check, ignoring response for ${id}`
          );
          return;
        }

        // Store complete response for debugging
        setDebugInfo((prev) => ({
          ...prev,
          statusResponse: taskStatusResponse.data,
          currentTaskId: currentTaskIdRef.current
        }));

        if (taskStatusResponse.data.status === 'SUCCESS') {
          setTaskStatus('COMPLETE');

          // Handle both possible result structures
          const taskResult =
            taskStatusResponse.data.result?.result ||
            taskStatusResponse.data.result;
          setResult(taskResult);

          setLoading(false);

          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (taskStatusResponse.data.status === 'FAILURE') {
          setTaskStatus('FAILED');
          setError(taskStatusResponse.data.message);
          setLoading(false);

          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching updates:', err);
      // Store error for debugging
      setDebugInfo((prev) => ({
        ...prev,
        lastError: err.message,
        errorTime: new Date().toISOString(),
        currentTaskId: currentTaskIdRef.current
      }));

      // Don't stop polling on temporary errors unless they persist
      const retryLimit = 5;
      if (debugInfo && debugInfo.errorCount >= retryLimit) {
        console.log(`Stopping polling after ${retryLimit} consecutive errors`);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setError(
          `Failed to fetch updates after ${retryLimit} attempts: ${err.message}`
        );
        setLoading(false);
      } else {
        setDebugInfo((prev) => ({
          ...prev,
          errorCount: (prev?.errorCount || 0) + 1
        }));
      }
    }
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Helper function to render step badge based on step type
  const renderStepBadge = (stepType) => {
    const badgeClasses = {
      planning: 'bg-blue-100 text-blue-800',
      execution: 'bg-green-100 text-green-800',
      evaluation: 'bg-purple-100 text-purple-800',
      complete: 'bg-indigo-100 text-indigo-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      analysis: 'bg-teal-100 text-teal-800',
      setup: 'bg-cyan-100 text-cyan-800',
      browser: 'bg-emerald-100 text-emerald-800',
      default: 'bg-dark-100 text-dark-800'
    };

    const badgeClass =
      badgeClasses[stepType?.toLowerCase()] || badgeClasses.default;

    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass}`}
      >
        {stepType || 'Info'}
      </span>
    );
  };

  return (
    <>
      <PageHead title="Dashboard | App" />
      <div className="max-h-screen flex-1 space-y-4 overflow-y-auto p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Hi, Welcome back 👋
          </h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">PDF Viewer</TabsTrigger>
            <TabsTrigger value="agent">Agent Dashboard</TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger>
            {/* Debug tab for developers */}
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Now contains PDF Viewer */}
          <TabsContent value="overview">
            <PDFViewer />
          </TabsContent>

          {/* Agent Dashboard Tab - New Component */}
          <TabsContent value="agent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Query</CardTitle>
                <CardDescription>
                  Enter your query to start an automated agent task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter your query here..."
                      className="border-dark-300 flex-grow rounded-l-md border bg-white p-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <button
                      onClick={startAgentTask}
                      disabled={loading}
                      className="rounded-r-md bg-blue-600 px-6 py-3 font-bold text-white transition duration-150 ease-in-out hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Run Agent'}
                    </button>
                  </div>
                  {error && <div className="mt-2 text-red-600">{error}</div>}
                </div>
              </CardContent>
            </Card>

            {/* Task Status Card */}
            {taskId && (
              <Card>
                <CardHeader>
                  <CardTitle>Task Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center">
                      <span className="mr-2 font-semibold">Task ID:</span>
                      <code className="bg-dark-100 rounded p-1">{taskId}</code>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 font-semibold">Status:</span>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          taskStatus === 'COMPLETE'
                            ? 'bg-green-100 text-green-800'
                            : taskStatus === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {taskStatus}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Updates Feed Card */}
            {updates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Updates</CardTitle>
                  <CardDescription>
                    Real-time updates from the agent ({updates.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    ref={updateContainerRef}
                    className="border-dark-300 bg-dark-50 h-96 overflow-y-auto rounded-md border p-4"
                  >
                    {updates.map((update, index) => (
                      <div
                        key={index}
                        className="border-dark-200 mb-3 border-b pb-3 last:border-b-0"
                      >
                        <div className="mb-1 flex items-start justify-between">
                          <div className="flex items-center">
                            {renderStepBadge(update.step_type)}
                            <span className="ml-2 font-semibold">
                              {update.status}
                            </span>
                          </div>
                          <span className="text-dark-500 text-xs">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-dark-700">{update.message}</p>

                        {/* Show data if available */}
                        {update.data && (
                          <div className="mt-2">
                            {update.data.screenshots &&
                              Object.keys(update.data.screenshots).length >
                                0 && (
                                <div className="mt-2">
                                  <p className="mb-1 text-sm font-semibold">
                                    Screenshots:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(
                                      update.data.screenshots
                                    ).map(([key, path]) => (
                                      <div key={key} className="relative">
                                        <img
                                          src={`${API_BASE_URL}/screenshots/${path}`}
                                          alt={`${key} screenshot`}
                                          className="border-dark-300 h-32 rounded border object-cover"
                                        />
                                        <span className="absolute bottom-0 right-0 rounded-tl bg-black bg-opacity-70 px-1 text-xs text-white">
                                          {key}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Show plan data */}
                            {update.data.plan && (
                              <div className="bg-dark border-dark-200 mt-2 rounded border p-2">
                                <p className="mb-1 text-sm font-semibold">
                                  Plan:
                                </p>
                                <pre className="bg-dark-50 overflow-x-auto rounded p-2 text-xs">
                                  {JSON.stringify(update.data.plan, null, 2)}
                                </pre>
                              </div>
                            )}

                            {/* Show next step */}
                            {update.data.next_step && (
                              <div className="bg-dark border-dark-200 mt-2 rounded border p-2">
                                <p className="mb-1 text-sm font-semibold">
                                  Next Step:
                                </p>
                                <pre className="bg-dark-50 overflow-x-auto rounded p-2 text-xs">
                                  {typeof update.data.next_step === 'string'
                                    ? update.data.next_step
                                    : JSON.stringify(
                                        update.data.next_step,
                                        null,
                                        2
                                      )}
                                </pre>
                              </div>
                            )}

                            {/* Show extracted data */}
                            {update.data.response &&
                              update.data.response.collected_data && (
                                <div className="bg-dark border-dark-200 mt-2 rounded border p-2">
                                  <p className="mb-1 text-sm font-semibold">
                                    Collected Data:
                                  </p>
                                  <details>
                                    <summary className="cursor-pointer text-xs text-blue-600">
                                      Show/Hide Data
                                    </summary>
                                    <pre className="bg-dark-50 mt-1 overflow-x-auto rounded p-2 text-xs">
                                      {JSON.stringify(
                                        update.data.response.collected_data,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </details>
                                </div>
                              )}

                            {/* Show feedback data */}
                            {update.data.feedback && (
                              <div className="bg-dark border-dark-200 mt-2 rounded border p-2">
                                <p className="mb-1 text-sm font-semibold">
                                  Feedback:
                                </p>
                                <div className="bg-dark-50 rounded p-2 text-xs">
                                  {update.data.feedback}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final Result Card */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Final Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {(result.final_response ||
                    (result.result && result.result.final_response)) && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg font-semibold">Response</h3>
                      <div className="bg-dark-50 whitespace-pre-wrap rounded p-3">
                        {result.final_response || result.result?.final_response}
                      </div>
                    </div>
                  )}

                  {(result.collected_data ||
                    (result.result && result.result.collected_data)) && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg font-semibold">
                        Collected Data
                      </h3>
                      <div className="bg-dark-50 rounded p-3">
                        <details>
                          <summary className="cursor-pointer text-sm text-blue-600">
                            Show/Hide Collected Data
                          </summary>
                          <pre className="mt-2 overflow-x-auto p-2 text-xs">
                            {JSON.stringify(
                              result.collected_data ||
                                result.result?.collected_data,
                              null,
                              2
                            )}
                          </pre>
                        </details>
                      </div>
                    </div>
                  )}

                  {/* Sanctions Analysis Results */}
                  {(result.sanctions_analysis ||
                    (result.result && result.result.sanctions_analysis)) && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg font-semibold">
                        Sanctions Analysis
                      </h3>
                      <div className="bg-dark-50 rounded p-3">
                        <div className="mb-2 flex">
                          <div className="mr-4">
                            <span className="font-medium">
                              Risk Assessment:
                            </span>
                            <span
                              className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
                                (result.sanctions_analysis?.analysis_summary
                                  ?.overall_risk_assessment ||
                                  result.result?.sanctions_analysis
                                    ?.analysis_summary
                                    ?.overall_risk_assessment) === 'HIGH'
                                  ? 'bg-red-100 text-red-800'
                                  : (result.sanctions_analysis?.analysis_summary
                                        ?.overall_risk_assessment ||
                                        result.result?.sanctions_analysis
                                          ?.analysis_summary
                                          ?.overall_risk_assessment) ===
                                      'MEDIUM'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : (result.sanctions_analysis
                                          ?.analysis_summary
                                          ?.overall_risk_assessment ||
                                          result.result?.sanctions_analysis
                                            ?.analysis_summary
                                            ?.overall_risk_assessment) === 'LOW'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-dark-100 text-dark-800'
                              }`}
                            >
                              {result.sanctions_analysis?.analysis_summary
                                ?.overall_risk_assessment ||
                                result.result?.sanctions_analysis
                                  ?.analysis_summary?.overall_risk_assessment ||
                                'UNKNOWN'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Matches:</span>
                            <span className="ml-2">
                              {result.sanctions_analysis?.analysis_summary
                                ?.total_sanctions_matches ||
                                result.result?.sanctions_analysis
                                  ?.analysis_summary?.total_sanctions_matches ||
                                0}
                            </span>
                          </div>
                        </div>

                        {(result.sanctions_analysis?.conclusion ||
                          result.result?.sanctions_analysis?.conclusion) && (
                          <div className="mt-2">
                            <span className="font-medium">Conclusion:</span>
                            <p className="mt-1">
                              {result.sanctions_analysis?.conclusion ||
                                result.result?.sanctions_analysis?.conclusion}
                            </p>
                          </div>
                        )}

                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-blue-600">
                            Show Full Analysis
                          </summary>
                          <pre className="mt-2 overflow-x-auto p-2 text-xs">
                            {JSON.stringify(
                              result.sanctions_analysis ||
                                result.result?.sanctions_analysis,
                              null,
                              2
                            )}
                          </pre>
                        </details>
                      </div>
                    </div>
                  )}

                  {/* Execution Steps Summary */}
                  {(result.execution_history?.length > 0 ||
                    result.result?.execution_history?.length > 0) && (
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">
                        Execution History
                      </h3>
                      <div className="bg-dark-50 rounded p-3">
                        <details>
                          <summary className="cursor-pointer text-sm text-blue-600">
                            Show Execution History (
                            {(
                              result.execution_history ||
                              result.result?.execution_history
                            )?.length || 0}{' '}
                            steps)
                          </summary>
                          <div className="mt-2">
                            {(
                              result.execution_history ||
                              result.result?.execution_history
                            )?.map((step, index) => (
                              <div
                                key={index}
                                className="border-dark-200 mb-2 border-b pb-2 last:border-b-0"
                              >
                                <div className="flex items-center">
                                  <span className="mr-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                    Step {index + 1}
                                  </span>
                                  <span className="font-medium">
                                    {step.action_type}
                                  </span>
                                </div>
                                <div className="ml-8 mt-1">
                                  <div>
                                    <span className="text-dark-600 text-sm">
                                      Target:
                                    </span>{' '}
                                    {step.target}
                                  </div>
                                  {step.value && (
                                    <div>
                                      <span className="text-dark-600 text-sm">
                                        Value:
                                      </span>{' '}
                                      {step.value}
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-dark-600 text-sm">
                                      Time:
                                    </span>{' '}
                                    {step.timestamp
                                      ? new Date(
                                          typeof step.timestamp === 'number'
                                            ? step.timestamp * 1000
                                            : step.timestamp
                                        ).toLocaleTimeString()
                                      : 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Debug Tab - For developers */}
          <TabsContent value="debug" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
                <CardDescription>Internal state for debugging</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="mb-2 text-lg font-semibold">
                    Task ID: {taskId || 'None'}
                  </h3>
                  <h3 className="mb-2 text-lg font-semibold">
                    Current Task ID Ref: {currentTaskIdRef.current || 'None'}
                  </h3>
                  <h3 className="mb-2 text-lg font-semibold">
                    Status: {taskStatus}
                  </h3>
                  <h3 className="mb-2 text-lg font-semibold">
                    Update Count: {updates.length}
                  </h3>
                  <h3 className="mb-2 text-lg font-semibold">
                    Last Update Index: {lastUpdateIndex}
                  </h3>
                  <h3 className="mb-2 text-lg font-semibold">
                    Polling Active: {pollingIntervalRef.current ? 'Yes' : 'No'}
                  </h3>

                  <div className="mt-4">
                    <h3 className="mb-2 text-lg font-semibold">Debug Info</h3>
                    <pre className="bg-dark-100 max-h-64 overflow-auto p-3 text-xs">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>

                  <div className="mt-4">
                    <h3 className="mb-2 text-lg font-semibold">
                      Result Structure
                    </h3>
                    <pre className="bg-dark-100 max-h-64 overflow-auto p-3 text-xs">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
