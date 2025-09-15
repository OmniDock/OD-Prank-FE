import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { getProfile } from "@/lib/api.profile";
import LoadingScreen from "@/components/LoadingScreen";

// Helper function to get German subscription display names
const getSubscriptionDisplayName = (subscriptionType: string | null): string => {
  if (!subscriptionType) return "";
  
  const displayNames: Record<string, string> = {
    "weekly": "Wöchentliches Abo",
    "monthly": "Monatliches Abo",
  };
  
  return displayNames[subscriptionType] || subscriptionType;
};

interface ProfileData {
  call_credits: number;
  created_at: string;
  prank_credits: number;
  profile_uuid: string;
  subscription_id: string | null;
  subscription_type: string | null;
  updated_at: string;
  user_email: string;
  user_id: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getProfile();
        console.log("profileData", profileData);
        setProfile(profileData);
      } catch (err: any) {
        setError(err?.message || "Fehler beim Laden des Profils");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return <LoadingScreen message="Profil wird geladen..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <div className="text-danger text-lg font-semibold mb-2">Fehler</div>
            <div className="text-default-600">{error}</div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-default-600">Kein Profil gefunden</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-foreground">Mein Profil</h1>
          <Button
            variant="flat"
            color="default"
            onPress={() => navigate("/dashboard")}
            startContent={<span>←</span>}
            className="text-default-600 hover:text-foreground"
          >
          </Button>
        </div>
        <p className="text-default-600">Verwalte Kontoinformationen und Credits</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card className="shadow-medium">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">👤</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Kontoinformationen</h3>
                <p className="text-sm text-default-500">Persönlichen Daten</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="text-sm font-medium text-default-600">E-Mail-Adresse</label>
              <div className="text-lg font-medium text-foreground">{profile.user_email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-default-600">Mitglied seit</label>
              <div className="text-lg font-medium text-foreground">
                {new Date(profile.created_at).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Credits */}
        <Card className="shadow-medium">
          <CardHeader className="bg-gradient-to-r from-success/10 to-success/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <span className="text-success font-semibold">💰</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Credits</h3>
                <p className="text-sm text-default-500">Ihr aktuelles Guthaben</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-default-600">Anruf-Credits</div>
                <div className="text-xs text-default-500">Für Telefonanrufe</div>
              </div>
              <div className="text-2xl font-bold text-primary">{profile.call_credits}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-default-600">Prank-Credits</div>
                <div className="text-xs text-default-500">Für Streich-Szenarien</div>
              </div>
              <div className="text-2xl font-bold text-secondary">{profile.prank_credits}</div>
            </div>
          </CardBody>
        </Card>

        {/* Subscription Status */}
        <Card className="shadow-medium md:col-span-2">
          <CardHeader className="bg-gradient-to-r from-warning/10 to-warning/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <span className="text-warning font-semibold">📋</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Abonnement-Status</h3>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {!profile.subscription_type ? (
              <div className="text-center py-6">
                <div className="mb-4">
                  <div className="text-lg font-semibold text-default-700 mb-2">
                    Derzeit kein Abonnement
                  </div>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <span className="mr-2"></span>
                  Abonnieren
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-lg font-semibold text-success mb-2">
                  Aktiver Plan: {getSubscriptionDisplayName(profile.subscription_type)}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
