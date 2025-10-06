import { AppLayout } from "@/components/layout/app-layout";
import { FileText, UserCheck, AlertCircle, BookOpen, Shield, Scale } from "lucide-react";

export function TermsOfServicePage() {
  const lastUpdated = "January 6, 2025";

  const sections = [
    {
      icon: UserCheck,
      title: "Acceptance of Terms",
      content: [
        {
          text: "By accessing or using Syto ('the Platform', 'our Service', 'we', 'us'), you agree to be bound by these Terms of Service ('Terms'). If you do not agree to these Terms, please do not use Syto."
        },
        {
          text: "If you are under 18 years old, you must have permission from a parent or legal guardian to use Syto. By using our Service, you represent that you have obtained such permission."
        },
        {
          text: "These Terms constitute a legally binding agreement between you ('User', 'you', 'Student') and Syto. We reserve the right to modify these Terms at any time, and will notify you of significant changes."
        }
      ]
    },
    {
      icon: BookOpen,
      title: "Description of Service",
      content: [
        {
          subtitle: "What Syto Provides",
          text: "Syto is an educational technology platform designed for Ghanaian Primary 4-6 students. We provide: interactive learning modules for English Language and Mathematics aligned with the Ghana Education Service curriculum, AI-powered tutoring through 'NAANO' our virtual assistant, progress tracking and analytics, quizzes and assessments, and culturally relevant educational content."
        },
        {
          subtitle: "Free Service",
          text: "Syto is currently provided free of charge to all users. We reserve the right to introduce premium features or paid subscriptions in the future, but will provide advance notice and will always maintain a robust free tier for students."
        },
        {
          subtitle: "Platform Availability",
          text: "While we strive to keep Syto available 24/7, we do not guarantee uninterrupted access. The Platform may be unavailable due to: scheduled maintenance, technical difficulties, internet connectivity issues, force majeure events, or security incidents. We will provide advance notice of scheduled maintenance when possible."
        }
      ]
    },
    {
      icon: UserCheck,
      title: "User Accounts and Responsibilities",
      content: [
        {
          subtitle: "Account Creation",
          text: "To use Syto, you must create an account by providing: a valid email address, your first and last name, a secure password, and your grade level (Primary 4, 5, or 6). You must provide accurate and truthful information when creating your account."
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for: maintaining the confidentiality of your password, all activities that occur under your account, notifying us immediately of any unauthorized access, and logging out after each session, especially on shared devices."
        },
        {
          subtitle: "Account Restrictions",
          text: "You may not: create multiple accounts for the same person, share your account with others, use someone else's account without permission, create an account using false information, or attempt to impersonate another user."
        }
      ]
    },
    {
      icon: AlertCircle,
      title: "Acceptable Use Policy",
      content: [
        {
          subtitle: "Permitted Uses",
          text: "You may use Syto only for legitimate educational purposes, including: studying course materials, completing quizzes and exercises, seeking help from NAANO AI tutor, tracking your learning progress, and preparing for school assessments."
        },
        {
          subtitle: "Prohibited Activities",
          text: "You must NOT: cheat on quizzes or help others cheat, attempt to hack, disrupt, or damage the Platform, upload viruses or malicious code, use automated scripts or bots, scrape or copy large amounts of content, share or sell access to Syto, use the Platform for any illegal purpose, harass or abuse other users or our staff, attempt to circumvent security measures, or reverse engineer any part of the Platform."
        },
        {
          subtitle: "Consequences of Violations",
          text: "Violations of this Acceptable Use Policy may result in: warning or temporary suspension, permanent account termination, legal action if required, and reporting to appropriate authorities for serious violations."
        }
      ]
    },
    {
      icon: Scale,
      title: "Intellectual Property Rights",
      content: [
        {
          subtitle: "Syto's Content",
          text: "All content on Syto, including text, graphics, logos, videos, software, and curriculum materials, is owned by Syto or our licensors and protected by copyright, trademark, and other intellectual property laws. You may not: copy, modify, distribute, or sell our content, remove copyright or trademark notices, create derivative works without permission, or use our content for commercial purposes."
        },
        {
          subtitle: "Limited License",
          text: "We grant you a limited, non-exclusive, non-transferable license to access and use Syto for personal, educational purposes only. This license automatically terminates if you violate these Terms."
        },
        {
          subtitle: "User-Generated Content",
          text: "When you interact with NAANO AI or submit information on Syto, you retain ownership of your content. However, you grant us a license to use, store, and process your content to provide and improve our Service. We may use aggregated, anonymized data derived from user interactions for research and development."
        },
        {
          subtitle: "Feedback",
          text: "If you provide feedback, suggestions, or ideas about Syto, we may use them without any obligation to compensate you."
        }
      ]
    },
    {
      icon: Shield,
      title: "Privacy and Data Protection",
      content: [
        {
          text: "Your privacy is important to us. Our collection and use of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand how we handle your data."
        },
        {
          text: "Key privacy commitments: we never sell your personal data, we use encryption to protect your information, we collect only what's necessary for educational purposes, you can request your data or account deletion at any time, and we comply with applicable data protection laws including GDPR and children's privacy regulations."
        }
      ]
    },
    {
      icon: AlertCircle,
      title: "Disclaimers and Limitations of Liability",
      content: [
        {
          subtitle: "Educational Tool",
          text: "Syto is designed to supplement, not replace, formal education. We do not guarantee: academic success or improved grades, admission to any educational institution, passage of standardized tests, or mastery of any subject. Your learning outcomes depend on many factors including effort, prior knowledge, and offline study."
        },
        {
          subtitle: "AI Tutor Limitations",
          text: "NAANO, our AI tutor, provides educational assistance but: may occasionally provide incorrect or incomplete information, should not be the sole source for important academic decisions, does not replace human teachers or tutors, and responses are generated by AI and not reviewed by human educators before delivery."
        },
        {
          subtitle: "Service 'As Is'",
          text: "Syto is provided 'as is' and 'as available' without warranties of any kind, either express or implied. We disclaim all warranties including: merchantability, fitness for a particular purpose, non-infringement, accuracy or completeness of content, and uninterrupted or error-free service."
        },
        {
          subtitle: "Limitation of Liability",
          text: "To the fullest extent permitted by law, Syto and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or educational opportunities. Our total liability shall not exceed the amount you paid us in the past 12 months (which is currently zero for our free service)."
        }
      ]
    },
    {
      icon: FileText,
      title: "Termination",
      content: [
        {
          subtitle: "Your Right to Terminate",
          text: "You may terminate your account at any time by: sending a request to support@syto.online, or using the account deletion feature (when available). Upon termination, your access to Syto will end, but we may retain some data as described in our Privacy Policy."
        },
        {
          subtitle: "Our Right to Terminate",
          text: "We may suspend or terminate your account if you: violate these Terms, engage in fraudulent or illegal activity, threaten the security or performance of the Platform, fail to respond to our communications about Terms violations, or remain inactive for an extended period (we'll notify you first)."
        },
        {
          subtitle: "Effect of Termination",
          text: "Upon termination: your access to Syto will immediately cease, your account data may be deleted (subject to retention requirements), any licenses granted to you will end, and provisions that should survive (like indemnification and limitations of liability) will continue to apply."
        }
      ]
    }
  ];

  return (
    <AppLayout requireAuth={false}>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-ghana-green/5 via-ghana-gold/5 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-ghana-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-ghana-green/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-ghana-green to-ghana-gold mb-6 shadow-glass-lg">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-lg leading-relaxed mb-4">
              Welcome to Syto! These Terms of Service govern your use of the Syto learning platform. Please read them carefully.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              By creating an account or using Syto, you agree to these Terms. If you're under 18, please review these Terms with a parent or guardian.
            </p>
          </div>

          {/* Sections */}
          {sections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8 animate-slide-up"
              style={{ animationDelay: `${(sectionIndex + 2) * 0.1}s` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ghana-green/20 to-ghana-gold/20 flex items-center justify-center">
                  <section.icon className="h-7 w-7 text-ghana-green" />
                </div>
                <h2 className="text-3xl font-bold">{section.title}</h2>
              </div>

              <div className="space-y-6">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {item.subtitle && (
                      <h3 className="text-xl font-semibold mb-3 text-ghana-green dark:text-ghana-green-light">
                        {item.subtitle}
                      </h3>
                    )}
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Sections */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8">
            <h2 className="text-3xl font-bold mb-6">Governing Law and Dispute Resolution</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Ghana, without regard to conflict of law principles.
              </p>
              <p>
                Any disputes arising from these Terms or your use of Syto shall be resolved through: good faith negotiation between the parties, mediation if negotiation fails, or binding arbitration in Accra, Ghana if mediation is unsuccessful.
              </p>
              <p>
                Nothing in this section prevents either party from seeking injunctive relief in court for urgent matters.
              </p>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8">
            <h2 className="text-3xl font-bold mb-6">Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless Syto, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from: your use of the Platform, your violation of these Terms, your violation of any rights of another party, or your violation of any applicable laws or regulations.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8">
            <h2 className="text-3xl font-bold mb-6">Miscellaneous</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Syto.
              </p>
              <p>
                <strong className="text-foreground">Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force.
              </p>
              <p>
                <strong className="text-foreground">Waiver:</strong> Our failure to enforce any provision of these Terms does not waive our right to enforce it later.
              </p>
              <p>
                <strong className="text-foreground">Assignment:</strong> You may not assign or transfer these Terms. We may assign these Terms to any successor or affiliate.
              </p>
              <p>
                <strong className="text-foreground">Language:</strong> These Terms are written in English. Any translations are provided for convenience only, and the English version controls.
              </p>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8">
            <h2 className="text-3xl font-bold mb-6">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may update these Terms from time to time. When we make changes, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
              <li>Update the "Last Updated" date at the top</li>
              <li>Notify you via email for significant changes</li>
              <li>Post a notice on the Platform</li>
              <li>Require you to accept new Terms for material changes</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Your continued use of Syto after changes take effect constitutes acceptance of the new Terms. If you don't agree to the changes, you must stop using Syto and may request account deletion.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-br from-ghana-green via-ghana-gold to-ghana-red p-1 rounded-3xl shadow-2xl">
            <div className="bg-white dark:bg-gray-950 rounded-3xl p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Questions About These Terms?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                If you have any questions or concerns about these Terms of Service, please contact us:
              </p>
              <div className="space-y-3 text-lg">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:legal@syto.online" className="text-ghana-green hover:text-ghana-gold transition-colors">
                    legal@syto.online
                  </a>
                </p>
                <p>
                  <strong>Support:</strong>{" "}
                  <a href="mailto:support@syto.online" className="text-ghana-green hover:text-ghana-gold transition-colors">
                    support@syto.online
                  </a>
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Syto Educational Technology<br />
                Accra, Ghana
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
