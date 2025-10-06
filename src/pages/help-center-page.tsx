import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Search, ChevronDown, BookOpen, User, MessageSquare, CreditCard, Shield, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    { name: "All", icon: HelpCircle, color: "from-primary-400 to-primary-600" },
    { name: "Getting Started", icon: BookOpen, color: "from-ghana-green to-ghana-green-light" },
    { name: "Account", icon: User, color: "from-ghana-gold to-ghana-gold-dark" },
    { name: "Learning", icon: MessageSquare, color: "from-success-400 to-success-600" },
    { name: "Technical", icon: Shield, color: "from-error-400 to-error-600" },
  ];

  const faqs: FAQItem[] = [
    {
      category: "Getting Started",
      question: "How do I create an account on Syto?",
      answer: "To create an account, click the 'Get Started' or 'Sign Up' button on the homepage. You'll need to provide your email address, create a password, enter your first and last name, and select your grade level (Primary 4, 5, or 6). After signing up, check your email for a verification link. Once verified, you can log in and start learning!"
    },
    {
      category: "Getting Started",
      question: "What subjects are available on Syto?",
      answer: "Syto currently offers two core subjects aligned with the Ghanaian Primary 4-6 curriculum: English Language and Mathematics. Each subject contains multiple modules covering different topics, with interactive exercises and quizzes designed specifically for Ghanaian students."
    },
    {
      category: "Getting Started",
      question: "Is Syto free to use?",
      answer: "Yes! Syto is completely free for all Ghanaian Primary 4-6 students. We believe in making quality education accessible to everyone. All features, including access to NAANO (our AI tutor), progress tracking, and all learning modules are available at no cost."
    },
    {
      category: "Account",
      question: "How do I change my grade level?",
      answer: "You can update your grade level by going to your Profile page. Click on the 'Edit Profile' button, select your new grade level from the dropdown menu, and click 'Save Changes'. Your learning content will automatically adjust to match your selected grade level."
    },
    {
      category: "Account",
      question: "I forgot my password. What should I do?",
      answer: "On the login page, click the 'Forgot Password?' link. Enter your email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password. If you don't receive the email within 5 minutes, check your spam folder."
    },
    {
      category: "Account",
      question: "How do I update my profile information?",
      answer: "Go to your Profile page from the main menu. Click the 'Edit Profile' button to modify your first name, last name, or grade level. Note that your email address cannot be changed for security reasons. Click 'Save Changes' when you're done."
    },
    {
      category: "Learning",
      question: "What is NAANO and how do I use it?",
      answer: "NAANO is your friendly AI tutor, available 24/7 to help you understand difficult concepts. You can access NAANO from the main menu or while answering questions. Simply type your question in Ghanaian English, and NAANO will provide culturally relevant explanations with examples using Ghanaian names, places, and contexts. NAANO can explain concepts in simpler terms, provide real-world examples, and answer follow-up questions."
    },
    {
      category: "Learning",
      question: "How do I start a lesson?",
      answer: "From your Dashboard, select either English or Mathematics. Choose a module that interests you, then select a specific topic within that module. Finally, choose an exercise to begin. Each exercise contains multiple questions that test your understanding of the topic. You can take your time and use NAANO for help whenever needed."
    },
    {
      category: "Learning",
      question: "Can I retake quizzes?",
      answer: "Yes! You can retake any quiz or exercise as many times as you want. This is a great way to improve your understanding and boost your scores. Your highest score will be recorded in your progress tracker, but you can view all your attempts in your learning history."
    },
    {
      category: "Learning",
      question: "How is my progress tracked?",
      answer: "Syto automatically tracks your learning progress, including completed modules, quiz scores, time spent learning, and topics you've mastered. You can view your overall progress on your Dashboard, which shows completion percentages for English and Mathematics, recent activities, and personalized recommendations."
    },
    {
      category: "Learning",
      question: "What happens if I get a question wrong?",
      answer: "When you submit an incorrect answer, Syto will show you the correct answer along with a detailed explanation. You can also click to expand the NAANO helper panel to ask follow-up questions and get additional clarification. This helps you learn from your mistakes and understand the concept better."
    },
    {
      category: "Technical",
      question: "What devices can I use Syto on?",
      answer: "Syto works on any device with a modern web browser and internet connection, including desktop computers, laptops, tablets, and smartphones. We recommend using the latest version of Chrome, Firefox, Safari, or Edge for the best experience."
    },
    {
      category: "Technical",
      question: "Why is Syto loading slowly?",
      answer: "Slow loading can be caused by poor internet connection, too many browser tabs open, or outdated browser cache. Try closing unnecessary tabs, clearing your browser cache, or switching to a better internet connection. If problems persist, try refreshing the page or logging out and back in."
    },
    {
      category: "Technical",
      question: "The website isn't displaying correctly. What should I do?",
      answer: "First, try refreshing the page (Ctrl+R or Cmd+R). If that doesn't work, clear your browser cache and cookies, then restart your browser. Make sure you're using an updated browser version. You can also try switching between dark and light mode using the theme toggle in the header."
    },
    {
      category: "Technical",
      question: "Is my data safe on Syto?",
      answer: "Yes! We take data security very seriously. All data is encrypted during transmission and storage. We never share your personal information with third parties without your consent. Your learning data is used only to improve your experience and provide personalized recommendations. See our Privacy Policy for complete details."
    },
    {
      category: "Account",
      question: "Can I delete my account?",
      answer: "Yes, you can request account deletion by contacting us at support@syto.online. Please note that deleting your account will permanently remove all your learning progress, quiz scores, and personal data. This action cannot be undone."
    },
    {
      category: "Learning",
      question: "How do I know which topics to study?",
      answer: "Your Dashboard provides personalized recommendations based on your grade level and learning progress. We suggest starting with topics marked as 'Recommended for You'. You can also view your weak areas in your Progress section and focus on improving those topics."
    },
    {
      category: "Technical",
      question: "Can I use Syto offline?",
      answer: "Currently, Syto requires an internet connection to function properly as it uses AI-powered features and real-time progress tracking. We're working on an offline mode for future releases that will allow you to download lessons for offline study."
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout requireAuth={false}>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-ghana-green/5 via-ghana-gold/5 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-ghana-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-ghana-green/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">
              Help Center
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions and learn how to make the most of Syto
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light transition-all"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category, index) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`
                    px-6 py-3 rounded-xl backdrop-blur-xl border transition-all duration-300 animate-scale-in
                    ${selectedCategory === category.name
                      ? 'bg-white/80 dark:bg-white/10 border-ghana-green shadow-glass-lg scale-105'
                      : 'bg-white/60 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10'
                    }
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${category.color}`}>
                      <category.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-glass overflow-hidden animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-white/40 dark:hover:bg-white/10 transition-all"
                    >
                      <div className="flex-1">
                        <span className="inline-block px-3 py-1 rounded-full bg-ghana-green/10 text-ghana-green text-xs font-medium mb-2">
                          {faq.category}
                        </span>
                        <h3 className="text-lg font-semibold">{faq.question}</h3>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ml-4 ${
                          expandedFAQ === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedFAQ === index && (
                      <div className="px-6 pb-5 animate-slide-up">
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No results found for "{searchQuery}". Try different keywords or browse by category.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <div className="bg-gradient-to-br from-ghana-green via-ghana-gold to-ghana-red p-1 rounded-3xl shadow-2xl animate-slide-up">
              <div className="bg-white dark:bg-gray-950 rounded-3xl p-8 md:p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Can't find the answer you're looking for? Our support team is here to help you with any questions or issues.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:support@syto.online"
                    className="px-8 py-4 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Email Support
                  </a>
                  <a
                    href="/naano"
                    className="px-8 py-4 border-2 border-ghana-green rounded-2xl font-semibold hover:bg-ghana-green/10 transition-all"
                  >
                    Ask NAANO AI
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
