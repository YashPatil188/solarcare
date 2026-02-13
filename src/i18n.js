import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
    en: {
        translation: {
            "welcome": "Welcome Back",
            "signin_desc": "Sign in to manage your solar system",
            "email": "Email",
            "password": "Password",
            "signin": "Sign In",
            "signup": "Sign Up",
            "dont_have_account": "Don't have an account?",
            "dashboard": "Dashboard",
            "services": "Services",
            "reports": "Reports",
            "account": "Account",
            "logout": "Log Out",
            "settings": "Settings",
            "language": "Language",
            "profile": "Profile",
            "capacity": "System Capacity",
            "installation_date": "Installation Date",
            "address": "Address",
            "amc_request_submitted": "Request Submitted! Waiting for approval.",
            "no_active_tickets": "No active tickets."
        }
    },
    hi: {
        translation: {
            "welcome": "वापसी पर स्वागत है",
            "signin_desc": "अपने सौर प्रणाली का प्रबंधन करने के लिए साइन इन करें",
            "email": "ईमेल",
            "password": "पासवर्ड",
            "signin": "साइन इन करें",
            "signup": "साइन अप करें",
            "dont_have_account": "खाता नहीं है?",
            "dashboard": "डैशबोर्ड",
            "services": "सेवाएं",
            "reports": "रिपोर्ट",
            "account": "खाता",
            "logout": "लॉग आउट",
            "settings": "सेटिंग्स",
            "language": "भाषा",
            "profile": "प्रोफ़ाइल",
            "capacity": "प्रणाली क्षमता",
            "installation_date": "स्थापना तिथि",
            "address": "पता",
            "amc_request_submitted": "अनुरोध जमा किया गया! अनुमोदन की प्रतीक्षा है।",
            "no_active_tickets": "कोई सक्रिय टिकट नहीं।"
        }
    },
    mr: {
        translation: {
            "welcome": "पुन्हा स्वागत आहे",
            "signin_desc": "आपल्या सौर प्रणालीचे व्यवस्थापन करण्यासाठी साइन इन करा",
            "email": "ईमेल",
            "password": "पासवर्ड",
            "signin": "साइन इन करा",
            "signup": "साइन अप करा",
            "dont_have_account": "खाते नाही?",
            "dashboard": "डॅशबोर्ड",
            "services": "सेवा",
            "reports": "अहवाल",
            "account": "खाते",
            "logout": "लॉग आउट",
            "settings": "सेटिंग्ज",
            "language": "भाषा",
            "profile": "प्रोफाइल",
            "capacity": "प्रणाली क्षमता",
            "installation_date": "स्थापना तारीख",
            "address": "पत्ता",
            "amc_request_submitted": "विनंती सबमिट केली! मंजुरीची वाट पाहत आहे.",
            "no_active_tickets": " कोणतीही सक्रिय तिकिटे नाहीत."
        }
    },
    kn: {
        translation: {
            "welcome": "ಮತ್ತೆ ಸ್ವಾಗತ",
            "signin_desc": "ನಿಮ್ಮ ಸೌರ ವ್ಯವಸ್ಥೆಯನ್ನು ನಿರ್ವಹಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
            "email": "ಇಮೇಲ್",
            "password": "ಪಾಸ್ವರ್ಡ್",
            "signin": "ಸೈನ್ ಇನ್",
            "signup": "ಸೈನ್ ಅಪ್",
            "dont_have_account": "ಖಾತೆ ಇಲ್ಲವೇ?",
            "dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
            "services": "ಸೇವೆಗಳು",
            "reports": "ವರದಿಗಳು",
            "account": "ಖಾತೆ",
            "logout": "ಲಾಗ್ ಔಟ್",
            "settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
            "language": "ಭಾಷೆ",
            "profile": "ಪ್ರೊಫೈಲ್",
            "capacity": "ವ್ಯವಸ್ಥೆಯ ಸಾಮರ್ಥ್ಯ",
            "installation_date": "ಸ್ಥಾಪನೆ ದಿನಾಂಕ",
            "address": "ವಿಳಾಸ",
            "amc_request_submitted": "ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಲಾಗಿದೆ! ಅನುಮೋದನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ.",
            "no_active_tickets": "ಯಾವುದೇ ಸಕ್ರಿಯ ಟಿಕೆಟ್‌ಗಳಿಲ್ಲ."
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en", // default language
        fallbackLng: "en",
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
