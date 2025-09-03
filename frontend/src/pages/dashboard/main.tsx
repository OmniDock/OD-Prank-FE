import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDisclosure } from "@heroui/modal";
import ScenarioCreateModal from "@/components/scenario-create-modal";

export default function DashboardMain() {
	const location = useLocation();
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	
	useEffect(() => {
		// Check if we have a pending scenario from the landing page
		const pendingScenario = location.state?.pendingScenario;
		if (pendingScenario) {
			// Store it for the modal to use
			sessionStorage.setItem('preFillDescription', pendingScenario);
			// Open the scenario creation modal
			onOpen();
			// Clear the state to prevent re-opening on refresh
			window.history.replaceState({}, document.title);
		}
	}, [location.state, onOpen]);

	return (
		<section className="">
			<div className="p-6">
				<h1 className="text-2xl font-bold mb-4">Dashboard</h1>
				<p className="text-gray-600 dark:text-gray-400">Welcome to your prank dashboard!</p>
			</div>
			
			<ScenarioCreateModal 
				isOpen={isOpen} 
				onOpenChange={onOpenChange}
			/>
		</section>
	);
}
