"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BookOpen,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  Monitor,
  FolderOpen,
  MousePointerClick,
  CheckCircle,
  FileText,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import Image from "next/image";

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  steps: {
    title: string;
    description: string;
    icon: React.ElementType;
  }[];
  tips: string[];
}

const pmsGuides: GuideSection[] = [
  {
    id: "dentrix",
    title: "Dentrix",
    icon: <Image src="/dentrix-logo.png" alt="Dentrix" width={24} height={24} className="object-contain filter drop-shadow-md brightness-0 invert" />,
    color: "from-blue-500 to-blue-600 text-white shadow-blue-500/20",
    steps: [
      {
        title: "Export from EOB Reader",
        description:
          'Open your approved batch, click "Export", and select "Dentrix" as the format. Save the generated .835 file to a known location on your computer.',
        icon: Download,
      },
      {
        title: "Open Dentrix Office Manager",
        description:
          'Launch Dentrix and navigate to the Office Manager module. Go to "Maintenance" → "Practice Setup" → "Preferences" and ensure ERA processing is enabled.',
        icon: Monitor,
      },
      {
        title: "Import the ERA File",
        description:
          'In the Dentrix Ledger or Insurance Collection Manager, select "Import ERA File". Browse to the .835 file you exported from EOB Reader and select it.',
        icon: Upload,
      },
      {
        title: "Review & Post Payments",
        description:
          "Dentrix will parse the file and display the payment details. Review each claim, verify the amounts match, then click \"Post\" to apply the insurance payments to patient accounts.",
        icon: CheckCircle,
      },
    ],
    tips: [
      "Make sure the .835 file extension is preserved — Dentrix won't recognize .csv or .txt files in the ERA workflow.",
      "Always verify that you've received the actual funds (EFT or check) before posting payments.",
      "If you use Dentrix Enterprise, the import option is under the Insurance Collection Manager module.",
      "Contact Dentrix Support if you need to set up the eClaims ERA service for automatic retrieval.",
    ],
  },
  {
    id: "eaglesoft",
    title: "Eaglesoft",
    icon: <Image src="/eaglesoft-logo.png" alt="Eaglesoft" width={24} height={24} className="object-contain filter drop-shadow-md brightness-0 invert" />,
    color: "from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20",
    steps: [
      {
        title: "Export from EOB Reader",
        description:
          'Open your approved batch, click "Export", and select "Eaglesoft" as the format. Save the generated .835 file to your desktop or designated folder.',
        icon: Download,
      },
      {
        title: "Open Claims Processing",
        description:
          'In Eaglesoft, navigate to the "Claims Processing" screen. This is where ERA files are managed and payments are posted.',
        icon: Monitor,
      },
      {
        title: "Import the ERA File",
        description:
          'Click "eClaims" → "Download Reports". If importing manually, use the file browser to locate your .835 file. Eaglesoft will read the file and auto-populate the check numbers and payment information.',
        icon: FolderOpen,
      },
      {
        title: "Review & Apply Payments",
        description:
          'The bulk payment window will display all claims from the ERA. Review each line item, then click "Apply" to post payments. The EOB will be linked to each claim for future reference.',
        icon: CheckCircle,
      },
    ],
    tips: [
      "Eaglesoft auto-populates check numbers and EFT numbers from the ERA file — verify these match your bank deposits.",
      "After posting, you can view the EOB within any claim by clicking the \"View EOB\" button.",
      "If a specific payer isn't working, contact Patterson Dental to verify your ERA enrollment for that carrier.",
      "Press F1 inside Eaglesoft for context-sensitive help on any screen.",
    ],
  },
  {
    id: "open_dental",
    title: "Open Dental",
    icon: <Image src="/open-dental-logo.png" alt="Open Dental" width={24} height={24} className="object-contain filter drop-shadow-md brightness-0 invert" />,
    color: "from-purple-500 to-purple-600 text-white shadow-purple-500/20",
    steps: [
      {
        title: "Export from EOB Reader",
        description:
          'Open your approved batch, click "Export", and select "Open Dental" as the format. Save the .835 file to your Open Dental report path folder.',
        icon: Download,
      },
      {
        title: "Configure Report Path",
        description:
          'In Open Dental, go to "Setup" → "Family/Insurance" → "Clearinghouses". Verify the "Report Path" is set to the folder where you saved your .835 file.',
        icon: FolderOpen,
      },
      {
        title: "Open the ERAs Window",
        description:
          'Navigate to the "Manage Module" and click on "ERAs". Open Dental will scan the report path and list any new .835 files found.',
        icon: Monitor,
      },
      {
        title: "Process & Post Payments",
        description:
          'Select the ERA file from the list and click "Receive". Open Dental will match claims automatically. Review the matched payments, make any corrections, then finalize to post all payments.',
        icon: CheckCircle,
      },
    ],
    tips: [
      "The .835 file must be in Open Dental's configured report path — it won't scan other directories.",
      "Open Dental supports auto-download from clearinghouses like DentalXChange and EDS for fully automated workflows.",
      "Use \"Batch Insurance Payment\" in the Manage Module for manual entry if needed.",
      "For troubleshooting, ensure the file extension is .835 or .txt — Open Dental won't recognize .csv files.",
    ],
  },
];

export default function GuidePage() {
  const [expandedGuide, setExpandedGuide] = useState<string | null>("dentrix");

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">
          Import Guide
        </h1>
        <p className="text-black/50 mt-1 font-medium">
          Step-by-step instructions for importing EOB Reader exports into your
          practice management software.
        </p>
      </div>

      {/* Overview Card */}
      <Card className="bg-blue-50/50 border-blue-100 shadow-sm rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black mb-1">
                How It Works
              </h3>
              <p className="text-sm font-medium text-black/60 leading-relaxed">
                EOB Reader exports your verified payment data as industry-standard{" "}
                <span className="text-blue-600 font-bold">ANSI X12 835 ERA</span>{" "}
                files — the same format used by clearinghouses. Your PMS reads
                these files and automatically posts payments, eliminating manual data entry.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            step: "1",
            title: "Upload & Extract",
            desc: "Upload EOB PDFs and let AI extract the payment data",
            icon: FileText,
          },
          {
            step: "2",
            title: "Review & Approve",
            desc: "Verify extracted data, approve or correct any errors",
            icon: MousePointerClick,
          },
          {
            step: "3",
            title: "Export & Import",
            desc: "Export as 835 file and import into your PMS",
            icon: Download,
          },
        ].map((item) => (
          <Card
            key={item.step}
            className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-600 text-sm font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <item.icon className="w-5 h-5 text-black/30" />
              </div>
              <h4 className="text-base font-bold text-black">{item.title}</h4>
              <p className="text-sm font-medium text-black/50 mt-2">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PMS-specific Guides */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-black flex items-center gap-2">
          <Monitor className="w-6 h-6 text-black/40" />
          Software-Specific Instructions
        </h2>

        {pmsGuides.map((guide) => {
          const isExpanded = expandedGuide === guide.id;
          return (
            <Card
              key={guide.id}
              className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedGuide(isExpanded ? null : guide.id)
                }
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center text-xl`}
                  >
                    {guide.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black">
                      {guide.title}
                    </h3>
                    <p className="text-sm font-medium text-black/50">
                      {guide.steps.length} steps to import
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-black/5 flex items-center justify-center bg-white shadow-sm">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-black/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-black/60" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-black/5 px-6 pb-6 bg-gray-50/30">
                  {/* Steps */}
                  <div className="space-y-0 mt-6">
                    {guide.steps.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center shrink-0">
                            <step.icon className="w-5 h-5 text-black/60" />
                          </div>
                          {i < guide.steps.length - 1 && (
                            <div className="w-px bg-black/10 flex-1 my-2" />
                          )}
                        </div>
                        <div className="pb-8 pt-2">
                          <h4 className="text-sm font-bold text-black mb-1">
                            Step {i + 1}: {step.title}
                          </h4>
                          <p className="text-sm font-medium text-black/60 leading-relaxed max-w-xl">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  <div className="mt-4 p-5 rounded-2xl bg-amber-50 border border-amber-200">
                    <h4 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4" />
                      Tips for {guide.title}
                    </h4>
                    <ul className="space-y-2">
                      {guide.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="text-sm font-medium text-amber-800/80 flex items-start gap-2"
                        >
                          <span className="text-amber-500 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card className="bg-white border-black/5 shadow-sm rounded-3xl mt-8">
        <CardHeader className="bg-gray-50/50 border-b border-black/5 p-6 rounded-t-3xl">
          <CardTitle className="text-black text-xl font-bold">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {[
            {
              q: "What file format does EOB Reader export?",
              a: "EOB Reader exports standard ANSI X12 835 ERA files (.835 extension), which is the industry standard for electronic remittance advice. All major dental practice management software supports this format.",
            },
            {
              q: "Can I import a CSV file instead?",
              a: "No — dental PMS software (Dentrix, Eaglesoft, Open Dental) requires the standardized .835 format, not CSV. EOB Reader handles this conversion for you automatically when you click Export.",
            },
            {
              q: "Do I need to approve all EOBs before exporting?",
              a: "Yes, all EOBs in a batch should be reviewed and approved before exporting to ensure payment accuracy. You can reject or flag any that need corrections.",
            },
            {
              q: "What if a claim doesn't match in my PMS?",
              a: "If your PMS can't match a claim automatically, you may need to manually link it to the correct patient/claim. Verify that patient names and claim numbers match between EOB Reader and your PMS.",
            },
          ].map((faq, i) => (
            <div key={i} className="border-b border-black/5 last:border-0 pb-6 last:pb-0">
              <p className="text-base font-bold text-black mb-2">{faq.q}</p>
              <p className="text-sm font-medium text-black/60 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
