import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
  Card,
  CardBody,
  Progress,
} from "@heroui/react";
import { processScenario, fetchScenario } from "@/lib/api.scenarios";
import type { ScenarioCreateRequest, Scenario } from "@/types/scenario";
import { useNavigate } from "react-router-dom";

interface ScenarioCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (scenario: Scenario) => void;
}

export default function ScenarioCreateModal({ isOpen, onOpenChange, onSuccess }: ScenarioCreateModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'initial' | 'clarifying' | 'processing'>('initial');
  const [form, setForm] = useState<ScenarioCreateRequest>({
    title: "Pizza Delivery Prank",
    target_name: "John Doe",
    language: "GERMAN",
    description: "A funny prank call pretending to be a pizza delivery service",
  });
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('initial');
      setSessionId(null);
      setClarifyingQuestions([]);
      setClarifications([]);
      setError(null);
    }
  }, [isOpen]);

  const canSubmitInitial = form.title.trim().length > 0 && form.target_name.trim().length > 0 && !loading;
  // Remove the requirement for all clarifications to be filled
  const canSubmitClarifications = !loading;

  async function handleInitialSubmit() {
    if (!canSubmitInitial) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await processScenario({ scenario: form });
      
      if (response.status === 'needs_clarification') {
        // Move to clarification step
        setSessionId(response.session_id!);
        setClarifyingQuestions(response.clarifying_questions as string[] || []);
        // Initialize with empty strings (placeholders will show in UI)
        setClarifications(new Array(response.clarifying_questions?.length || 0).fill(''));
        setStep('clarifying');
      } else if (response.status === 'complete' && response.scenario_id) {
        // Scenario created directly without clarifications
        setStep('processing');
        const scenario = await fetchScenario(response.scenario_id);
        
        if (onSuccess) {
          onSuccess(scenario);
        }
        
        // Reset form for next creation
        setForm({
          title: "Pizza Delivery Prank",
          target_name: "John Doe",
          language: "GERMAN",
          description: "A funny prank call pretending to be a pizza delivery service",
        });
        
        onOpenChange(false);
        navigate(`/dashboard/scenarios/${scenario.id}`);
      } else if (response.status === 'error') {
        setError(response.error || 'An error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scenario');
    } finally {
      setLoading(false);
    }
  }

  async function handleClarificationSubmit() {
    if (!canSubmitClarifications || !sessionId) return;
    
    setLoading(true);
    setError(null);
    setStep('processing');
    
    try {
      // Replace empty clarifications with default text
      const processedClarifications = clarifications.map(c => 
        c.trim() === '' ? 'Not important for this prank' : c
      );
      
      const response = await processScenario({
        session_id: sessionId,
        clarifying_questions: clarifyingQuestions,
        clarifications: processedClarifications,
      });
      
      if (response.status === 'complete' && response.scenario_id) {
        const scenario = await fetchScenario(response.scenario_id);
        
        if (onSuccess) {
          onSuccess(scenario);
        }
        
        // Reset form for next creation
        setForm({
          title: "Pizza Delivery Prank",
          target_name: "John Doe",
          language: "GERMAN",
          description: "A funny prank call pretending to be a pizza delivery service",
        });
        
        onOpenChange(false);
        navigate(`/dashboard/scenarios/${scenario.id}`);
      } else if (response.status === 'error') {
        setError(response.error || 'An error occurred');
        setStep('clarifying');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process clarifications');
      setStep('clarifying');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          {step === 'initial' && 'New Scenario'}
          {step === 'clarifying' && 'Additional Information Needed'}
          {step === 'processing' && 'Creating Your Scenario...'}
        </ModalHeader>
        
        <ModalBody className="space-y-4">
          {/* Progress indicator */}
          {step !== 'initial' && (
            <div className="mb-4">
              <Progress 
                value={step === 'clarifying' ? 50 : 100} 
                color="primary"
                className="mb-2"
              />
              <p className="text-sm text-default-500 text-center">
                {step === 'clarifying' && 'Step 2 of 2: Providing additional details'}
                {step === 'processing' && 'Generating your prank scenario...'}
              </p>
            </div>
          )}

          {/* Initial form */}
          {step === 'initial' && (
            <>
              <Input
                label="Title"
                isRequired
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                description="Give your prank scenario a memorable name"
              />
              <Input
                label="Target Name"
                isRequired
                value={form.target_name}
                onChange={(e) => setForm({ ...form, target_name: e.target.value })}
                description="The name of the person being pranked"
              />
              <Select
                label="Language"
                selectedKeys={new Set([form.language ?? "GERMAN"])}
                onSelectionChange={(keys) => {
                  const [key] = Array.from(keys as Set<string>);
                  setForm({ ...form, language: (key as any) });
                }}
                description="The language for the prank call"
              >
                <SelectItem key="GERMAN">German</SelectItem>
                <SelectItem key="ENGLISH">English</SelectItem>
              </Select>
              <Textarea
                label="Description"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                description="Describe the scenario in detail (e.g., 'Italian pizza delivery with wrong order')"
                minRows={3}
              />
            </>
          )}

          {/* Clarification questions */}
          {step === 'clarifying' && (
            <>
              <div className="space-y-4">
                <p className="text-sm text-default-600">
                  To create the perfect prank scenario, we need a bit more information:
                </p>
                <p className="text-xs text-default-400 italic">
                  You can skip any questions that aren't important for your prank - we'll use creative defaults.
                </p>
                
                {clarifyingQuestions.map((question, index) => (
                  <Card key={index} className="bg-default-50">
                    <CardBody className="space-y-2">
                      <p className="font-medium text-sm">{question}</p>
                      <Textarea
                        value={clarifications[index]}
                        onChange={(e) => {
                          const newClarifications = [...clarifications];
                          newClarifications[index] = e.target.value;
                          setClarifications(newClarifications);
                        }}
                        placeholder="(Optional) Leave empty to let AI be creative..."
                        minRows={2}
                        variant="bordered"
                        classNames={{
                          inputWrapper: "bg-background",
                        }}
                      />
                    </CardBody>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Processing state */}
          {step === 'processing' && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <p className="text-default-600">
                Our AI is crafting the perfect deadpan-serious prank scenario...
              </p>
              <p className="text-sm text-default-400 mt-2">
                This usually takes 10-20 seconds
              </p>
            </div>
          )}

          {/* Error display */}
          {error && step !== 'processing' && (
            <Card className="bg-danger-50 border-danger-200">
              <CardBody>
                <p className="text-danger text-sm">{error}</p>
              </CardBody>
            </Card>
          )}
        </ModalBody>
        
        <ModalFooter>
          {step === 'initial' && (
            <>
              <Button variant="light" size="sm" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                size="sm"
                color="primary" 
                onPress={handleInitialSubmit} 
                isDisabled={!canSubmitInitial} 
                isLoading={loading}
              >
                Continue
              </Button>
            </>
          )}
          
          {step === 'clarifying' && (
            <>
              <Button 
                variant="light" 
                size="sm"
                onPress={() => setStep('initial')}
                isDisabled={loading}
              >
                Back
              </Button>
              <Button 
                size="sm"
                color="primary" 
                onPress={handleClarificationSubmit} 
                isDisabled={!canSubmitClarifications} 
                isLoading={loading}
              >
                Create Scenario
              </Button>
            </>
          )}
          
          {step === 'processing' && (
            <Button variant="light" size="sm" isDisabled>
              Please wait...
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
