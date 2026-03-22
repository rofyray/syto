import { AppLayout } from "@/components/layout/app-layout";
import { Shield, Lock, Eye, UserCheck, Database, Cookie } from "lucide-react";

export function PrivacyPolicyPage() {
  const lastUpdated = "January 6, 2025";

  const sections = [
    {
      icon: Shield,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Personal Information",
          text: "When you create an account on Syto, we collect your email address, first name, last name, and grade level (Primary 4, 5, or 6). This information is necessary to provide you with personalized learning experiences and to track your educational progress."
        },
        {
          subtitle: "Learning Data",
          text: "We automatically collect information about your learning activities, including: completed modules and topics, quiz scores and attempts, time spent on exercises, questions answered (correct and incorrect), progress through the curriculum, and areas of strength and weakness. This data helps us provide personalized recommendations and improve your learning experience."
        },
        {
          subtitle: "Usage Information",
          text: "We collect technical information about how you use Syto, including: device type and operating system, browser type and version, IP address and general location (country/city level only), pages visited and time spent on each page, and interactions with NAANO (our AI tutor). This information helps us improve platform performance and user experience."
        },
        {
          subtitle: "Cookies and Similar Technologies",
          text: "We use cookies and similar tracking technologies to: keep you logged in, remember your preferences (theme, language), analyze how you use our platform, and improve our services. You can control cookie settings through your browser, but disabling certain cookies may limit some functionality."
        }
      ]
    },
    {
      icon: Lock,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Educational Services",
          text: "We use your information to: provide personalized learning content aligned with your grade level, track and display your progress, generate quiz questions and exercises, power NAANO AI tutor responses with culturally relevant examples, and identify topics you need help with."
        },
        {
          subtitle: "Platform Improvement",
          text: "We analyze aggregated, anonymized data to: improve our curriculum and question quality, enhance NAANO AI's teaching capabilities, identify common learning challenges, develop new features and content, and ensure platform stability and performance."
        },
        {
          subtitle: "Communication",
          text: "We may use your email address to: send important account notifications, provide password reset links, share learning tips and encouragement, announce new features or content (you can opt out), and respond to your support requests."
        }
      ]
    },
    {
      icon: Eye,
      title: "Information Sharing and Disclosure",
      content: [
        {
          subtitle: "We Do NOT Sell Your Data",
          text: "Syto will never sell, rent, or trade your personal information to third parties for marketing purposes. Your educational privacy is sacred to us."
        },
        {
          subtitle: "Service Providers",
          text: "We share limited information with trusted service providers who help us operate Syto: Supabase (database, authentication, and curriculum search), Anthropic (Claude AI for NAANO tutor), OpenAI (text embeddings), and Netlify (hosting). These providers are contractually obligated to protect your data and can only use it to provide services to us."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose your information if required by law, court order, or government request, or to protect the rights, property, or safety of Syto, our users, or others."
        },
        {
          subtitle: "Aggregated Data",
          text: "We may share aggregated, anonymized statistics about Syto usage (e.g., '1000 students completed Module X') for research or promotional purposes. This data cannot identify individual users."
        }
      ]
    },
    {
      icon: UserCheck,
      title: "Your Rights and Choices",
      content: [
        {
          subtitle: "Access and Update",
          text: "You can view and update your profile information (name, grade level) at any time through your Profile page. For other data access requests, contact us at privacy@syto.online."
        },
        {
          subtitle: "Data Portability",
          text: "You have the right to request a copy of your learning data in a machine-readable format. Contact us to request your data export."
        },
        {
          subtitle: "Deletion",
          text: "You can request deletion of your account and associated data by emailing support@syto.online. Note that some data may be retained for legal or legitimate business purposes (e.g., preventing fraud)."
        },
        {
          subtitle: "Marketing Communications",
          text: "You can opt out of promotional emails by clicking the 'unsubscribe' link in any marketing email. You'll still receive important account and security notifications."
        }
      ]
    },
    {
      icon: Database,
      title: "Data Security",
      content: [
        {
          subtitle: "How We Protect Your Data",
          text: "We implement industry-standard security measures including: encryption of data in transit (HTTPS/TLS) and at rest, secure authentication with hashed passwords (never stored in plain text), regular security audits and updates, access controls limiting who can view your data, and automated backups to prevent data loss."
        },
        {
          subtitle: "Data Retention",
          text: "We retain your account and learning data for as long as your account is active. After account deletion, we may retain some data for up to 90 days for backup and recovery purposes, then permanently delete it. Aggregated, anonymized data may be retained indefinitely for research purposes."
        }
      ]
    },
    {
      icon: Cookie,
      title: "Children's Privacy",
      content: [
        {
          subtitle: "Parental Consent",
          text: "Syto is designed for students in Primary 4-6 (typically ages 9-12). If you are under 13, you must have your parent or guardian's permission before creating an account or using Syto."
        },
        {
          subtitle: "Special Protections",
          text: "We take extra care to protect young learners: we collect only the minimum information necessary, we never ask for personal details beyond name, email, and grade level, NAANO AI responses are filtered for age-appropriateness, we prohibit third-party advertising on our platform, and we comply with international children's privacy laws."
        },
        {
          subtitle: "Parental Rights",
          text: "Parents and guardians can: review their child's information by contacting us, request deletion of their child's account, restrict certain features (contact us for options), and receive notifications about privacy policy changes."
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
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-lg leading-relaxed mb-4">
              Welcome to Syto! We are committed to protecting the privacy and security of our young learners and their families. This Privacy Policy explains how we collect, use, share, and protect your information when you use the Syto learning platform.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              By using Syto, you agree to the practices described in this policy. If you have any questions or concerns, please contact us at <a href="mailto:privacy@syto.online" className="text-ghana-green hover:text-ghana-gold transition-colors font-medium">privacy@syto.online</a>.
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
                    <h3 className="text-xl font-semibold mb-3 text-ghana-green dark:text-ghana-green-light">
                      {item.subtitle}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Information */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8">
            <h2 className="text-3xl font-bold mb-6">International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Syto operates primarily in Ghana, but some of our service providers may be located in other countries (e.g., USA, Europe). When we transfer your data internationally, we ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg mb-8">
            <h2 className="text-3xl font-bold mb-6">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Posting a notice on our platform</li>
              <li>Sending an email to your registered email address</li>
              <li>Updating the "Last Updated" date at the top of this policy</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Your continued use of Syto after any changes indicates your acceptance of the updated policy.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-br from-ghana-green via-ghana-gold to-ghana-red p-1 rounded-3xl shadow-2xl">
            <div className="bg-white dark:bg-gray-950 rounded-3xl p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Questions or Concerns?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                If you have any questions about this Privacy Policy or how we handle your information, please contact us:
              </p>
              <div className="space-y-3 text-lg">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@syto.online" className="text-ghana-green hover:text-ghana-gold transition-colors">
                    privacy@syto.online
                  </a>
                </p>
                <p>
                  <strong>Support:</strong>{" "}
                  <a href="mailto:support@syto.online" className="text-ghana-green hover:text-ghana-gold transition-colors">
                    support@syto.online
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
