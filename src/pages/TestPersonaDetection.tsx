import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sparkles, TestTube, CheckCircle2, XCircle } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";

interface TestScenario {
  name: string;
  expectedPersona: string;
  equilibreValues: { energie: number; temps: number; soutien: number; famille: number };
  motivations: string[];
  scenarioAnswers: Record<number, string>;
  environnement: { reseau: number; contextePro: number; margeManoeuvre: number };
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: "Dynamique Pressé",
    expectedPersona: "Le Dynamique Pressé",
    equilibreValues: { energie: 75, temps: 25, soutien: 50, famille: 50 },
    motivations: ["action", "accomplissement"],
    scenarioAnswers: { 0: "C - J'agis vite", 1: "A" },
    environnement: { reseau: 50, contextePro: 50, margeManoeuvre: 50 }
  },
  {
    name: "Prudent Bloqué",
    expectedPersona: "Le Prudent Bloqué",
    equilibreValues: { energie: 50, temps: 50, soutien: 50, famille: 50 },
    motivations: ["securite", "stabilite"],
    scenarioAnswers: { 0: "A - Je doute souvent", 1: "A" },
    environnement: { reseau: 50, contextePro: 50, margeManoeuvre: 50 }
  },
  {
    name: "Équilibriste Surchargé",
    expectedPersona: "L'Équilibriste Surchargé",
    equilibreValues: { energie: 30, temps: 25, soutien: 50, famille: 30 },
    motivations: ["equilibre", "famille"],
    scenarioAnswers: { 0: "B", 1: "C" },
    environnement: { reseau: 50, contextePro: 50, margeManoeuvre: 50 }
  },
  {
    name: "Créatif Dispersé",
    expectedPersona: "Le Créatif Dispersé",
    equilibreValues: { energie: 60, temps: 40, soutien: 50, famille: 50 },
    motivations: ["creativite", "innovation"],
    scenarioAnswers: { 0: "B", 1: "B - Je me disperse avec plusieurs idées" },
    environnement: { reseau: 50, contextePro: 50, margeManoeuvre: 50 }
  },
  {
    name: "Autonome Isolé",
    expectedPersona: "L'Autonome Isolé",
    equilibreValues: { energie: 50, temps: 50, soutien: 25, famille: 50 },
    motivations: ["autonomie", "independance"],
    scenarioAnswers: { 0: "B", 1: "C" },
    environnement: { reseau: 25, contextePro: 50, margeManoeuvre: 50 }
  }
];

export default function TestPersonaDetection() {
  const [customTest, setCustomTest] = useState({
    energie: 50,
    temps: 50,
    soutien: 50,
    famille: 50,
    reseau: 50,
    reponse0: "",
    reponse1: ""
  });

  const detectPersonaFromValues = (
    energie: number,
    temps: number,
    soutien: number,
    famille: number,
    reseau: number,
    reponse0: string,
    reponse1: string
  ): string => {
    // 1. Dynamique Pressé: "J'agis vite" + énergie haute + temps bas
    if (reponse0.includes("agis vite") || reponse0.includes("action") || reponse0 === "C") {
      if (energie > 60 && temps < 40) {
        return "Le Dynamique Pressé";
      }
    }
    
    // 2. Prudent Bloqué: "Je doute souvent"
    if (reponse0.includes("doute") || reponse0.includes("peur") || reponse0.includes("stress") || reponse0 === "A") {
      return "Le Prudent Bloqué";
    }
    
    // 3. Équilibriste Surchargé: Temps bas + énergie basse
    if ((temps < 40 && energie < 50) || famille < 40) {
      return "L'Équilibriste Surchargé";
    }
    
    // 4. Créatif Dispersé: "Je me disperse"
    if (reponse1.includes("disperse") || reponse1.includes("idées") || reponse1.includes("plusieurs") || reponse1 === "B") {
      return "Le Créatif Dispersé";
    }
    
    // 5. Autonome Isolé: Réseau faible
    if (reseau < 40 || soutien < 40) {
      return "L'Autonome Isolé";
    }
    
    // Default
    return "Le Prudent Bloqué";
  };

  const testScenario = (scenario: TestScenario) => {
    const detected = detectPersonaFromValues(
      scenario.equilibreValues.energie,
      scenario.equilibreValues.temps,
      scenario.equilibreValues.soutien,
      scenario.equilibreValues.famille,
      scenario.environnement.reseau,
      scenario.scenarioAnswers[0] || "",
      scenario.scenarioAnswers[1] || ""
    );
    return detected === scenario.expectedPersona;
  };

  const customDetectedPersona = detectPersonaFromValues(
    customTest.energie,
    customTest.temps,
    customTest.soutien,
    customTest.famille,
    customTest.reseau,
    customTest.reponse0,
    customTest.reponse1
  );

  const allTestsPass = TEST_SCENARIOS.every(testScenario);

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader pageTitle="Test de détection des profils" />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <TestTube className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Test de détection des profils</h1>
        </div>

        {/* Résumé global */}
        <Card className="p-6 mb-8 border-2" style={{ 
          borderColor: allTestsPass ? 'var(--success)' : 'var(--destructive)',
          backgroundColor: allTestsPass ? 'var(--success-bg)' : 'var(--destructive-bg)'
        }}>
          <div className="flex items-center gap-3">
            {allTestsPass ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-success" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Tous les tests passent ✓</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Les 5 profils sont correctement détectés avec leurs conditions respectives.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-destructive" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Certains tests échouent</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vérifiez les scénarios en échec ci-dessous.
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Scénarios prédéfinis */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Scénarios de test prédéfinis
          </h2>
          
          <div className="grid gap-4">
            {TEST_SCENARIOS.map((scenario, idx) => {
              const passed = testScenario(scenario);
              return (
                <Card key={idx} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-foreground">{scenario.name}</h3>
                        <Badge variant={passed ? "default" : "destructive"}>
                          {passed ? "✓ Détecté correctement" : "✗ Échec"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Énergie: {scenario.equilibreValues.energie}/100</div>
                          <div>Temps: {scenario.equilibreValues.temps}/100</div>
                          <div>Soutien: {scenario.equilibreValues.soutien}/100</div>
                          <div>Réseau: {scenario.environnement.reseau}/100</div>
                        </div>
                        <div>Réponse 1: {scenario.scenarioAnswers[0]}</div>
                        <div>Réponse 2: {scenario.scenarioAnswers[1]}</div>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="ml-4">
                      Attendu: {scenario.expectedPersona}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Test personnalisé */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Test personnalisé</h2>
          
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label>Énergie: {customTest.energie}/100</Label>
                <Slider
                  value={[customTest.energie]}
                  onValueChange={([value]) => setCustomTest(prev => ({ ...prev, energie: value }))}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Temps disponible: {customTest.temps}/100</Label>
                <Slider
                  value={[customTest.temps]}
                  onValueChange={([value]) => setCustomTest(prev => ({ ...prev, temps: value }))}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Soutien: {customTest.soutien}/100</Label>
                <Slider
                  value={[customTest.soutien]}
                  onValueChange={([value]) => setCustomTest(prev => ({ ...prev, soutien: value }))}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Famille: {customTest.famille}/100</Label>
                <Slider
                  value={[customTest.famille]}
                  onValueChange={([value]) => setCustomTest(prev => ({ ...prev, famille: value }))}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Réseau: {customTest.reseau}/100</Label>
                <Slider
                  value={[customTest.reseau]}
                  onValueChange={([value]) => setCustomTest(prev => ({ ...prev, reseau: value }))}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Réponse 1 (ex: "A - Je doute", "C - J'agis vite")</Label>
                <input
                  type="text"
                  value={customTest.reponse0}
                  onChange={(e) => setCustomTest(prev => ({ ...prev, reponse0: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                  placeholder="Entrez une réponse..."
                />
              </div>

              <div>
                <Label>Réponse 2 (ex: "B - Je me disperse")</Label>
                <input
                  type="text"
                  value={customTest.reponse1}
                  onChange={(e) => setCustomTest(prev => ({ ...prev, reponse1: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                  placeholder="Entrez une réponse..."
                />
              </div>

              <div className="pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-foreground">Profil détecté:</span>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {customDetectedPersona}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Guide des tests */}
          <Card className="p-6 mt-6 bg-muted/30">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Guide de test rapide</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Dynamique Pressé:</strong>
                <br />Énergie &gt;60, Temps &lt;40, Réponse 1: "C" ou contient "agis vite"
              </div>
              <div>
                <strong className="text-foreground">Prudent Bloqué:</strong>
                <br />Réponse 1: "A" ou contient "doute", "peur", "stress"
              </div>
              <div>
                <strong className="text-foreground">Équilibriste Surchargé:</strong>
                <br />(Temps &lt;40 ET Énergie &lt;50) OU Famille &lt;40
              </div>
              <div>
                <strong className="text-foreground">Créatif Dispersé:</strong>
                <br />Réponse 2: "B" ou contient "disperse", "idées", "plusieurs"
              </div>
              <div>
                <strong className="text-foreground">Autonome Isolé:</strong>
                <br />Réseau &lt;40 OU Soutien &lt;40
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
