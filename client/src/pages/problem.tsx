import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { ProblemDescription } from "@/components/problem-description";
import { CodeEditor } from "@/components/code-editor";
import { OutputPanel } from "@/components/output-panel";
import { UserMenu } from "@/components/user-menu";
import { AIChat } from "@/components/ai-chat"; // NEW IMPORT
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ChevronLeft } from "lucide-react";
import { ProblemDetail, CodeExecutionResult, DashboardData } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Problem() {
  const [, params] = useRoute("/problem/:id");
  const problemId = params?.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [code, setCode] = useState("");
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | undefined>();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [hintsUsed, setHintsUsed] = useState(0); // NEW: Track hints for AI context

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Define a type for the user object
  type User = { id: string; totalXp?: number; currentStreak?: number } | null;

  // Fetch current user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Fetch problem details
  const { data: problem, isLoading: problemLoading } = useQuery<ProblemDetail>({
    queryKey: [`/api/problems/${problemId}`],
    enabled: !!problemId,
  });

  // Fetch dashboard data for sidebar
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });

  // Reset state when problem ID changes
  useEffect(() => {
    setCode("");
    setExecutionResult(undefined);
    setHintsUsed(0); // Reset hints used
  }, [problemId]);

  // Initialize code when problem loads
  useEffect(() => {
    if (problem && !code) {
      setCode(problem.starter_code);
    }
  }, [problem, code]);

  // Code execution mutation
  const executeMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!problem) throw new Error("No problem loaded");
      
      const response = await apiRequest("POST", "/api/execute-code", {
        code,
        test_cases: problem.test_cases
      });
      return response.json();
    },
    onSuccess: (result) => {
      setExecutionResult(result);
      console.log("Code execution result:", result);
    },
    onError: (error) => {
      console.error("Execution error:", error);
      setExecutionResult({
        success: false,
        execution_time: 0,
        test_results: [],
        output: "",
        error: "Failed to execute code"
      });
    }
  });

  // Solution submission mutation
  const submitMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!problemId) throw new Error("No problem ID");
      
      const response = await apiRequest("POST", "/api/submit-solution", {
        problem_id: problemId,
        code,
        user_id: user?.id || "demo_user"
      });
      return response.json();
    },
    onSuccess: (result) => {
      console.log("Submission result:", result);
      setExecutionResult(result);
      
      // Invalidate dashboard data to refresh progress
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      // Show success notification if completed
      if (result.success && result.progress?.is_completed) {
        console.log("Problem completed successfully! XP gained:", result.progress?.xp_gained);
      }
    },
    onError: (error) => {
      console.error("Submission error:", error);
    }
  });

  // Hint usage mutation
  const hintMutation = useMutation({
    mutationFn: async () => {
      if (!problemId) throw new Error("No problem ID");
      
      const response = await apiRequest("POST", `/api/hint-used/${problemId}`, {
        user_id: user?.id || "demo_user"
      });
      return response.json();
    },
  });

  const handleRunCode = () => {
    console.log("Running code...");
    executeMutation.mutate(code);
  };

  const handleSubmitSolution = () => {
    console.log("Submitting solution...");
    submitMutation.mutate(code);
  };

  const handleReset = () => {
    if (problem) {
      setCode(problem.starter_code);
      setExecutionResult(undefined);
    }
  };

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1); // Track hints for AI context
    hintMutation.mutate();
  };

  const handleNextProblem = () => {
    // Navigate to next problem in sequence
    if (problemId) {
      const nextProblemId = problemId + 1;
      setLocation(`/problem/${nextProblemId}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (problemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 animate-pulse">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Problem Not Found</h1>
            <p className="text-gray-600 mb-4">The problem you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 animate-fade-in">
      {/* Enhanced Collapsible Sidebar */}
      {dashboardData && (
        <div className="animate-slide-in-right" style={{ animationDelay: '100ms' }}>
          <Sidebar
            sections={dashboardData.sections}
            currentProblemId={problemId || undefined}
            stats={dashboardData.stats}
            achievements={dashboardData.recent_achievements}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col animate-slide-up" style={{ animationDelay: '200ms' }}>
        {/* Top Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">{problem.breadcrumb.section}</span>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                <span className="text-gray-900 font-medium">{problem.breadcrumb.lesson}</span>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
              
              {/* User Menu */}
              <UserMenu user={user} size="sm" />
            </div>
          </div>
        </div>

        {/* Problem Interface */}
        <div className="flex-1 flex">
          <ProblemDescription 
            problem={problem} 
            onHintUsed={handleHintUsed}
          />
          
          <CodeEditor
            initialCode={code}
            onChange={setCode}
            onRun={handleRunCode}
            onSubmit={handleSubmitSolution}
            onReset={handleReset}
            isRunning={executeMutation.isPending}
            isSubmitting={submitMutation.isPending}
          />
          
          <OutputPanel
            result={executionResult}
            onNextProblem={handleNextProblem}
            showNextButton={!!(executionResult?.success && executionResult?.progress?.is_completed)}
          />
        </div>
      </div>

      {/* AI Chat Component - NEW! */}
      {problem && (
        <AIChat
          problem={problem}
          userCode={code}
          hintsUsed={hintsUsed}
          userLevel={1} // You can get this from user data when available
        />
      )}
    </div>
  );
}