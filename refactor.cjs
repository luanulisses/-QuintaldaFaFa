const fs = require('fs');

let content = fs.readFileSync('components/arraia2026/Arraia2026PreLaunch.tsx', 'utf8');

// 1. Add import
if (!content.includes('ArraiaTicketCheckout')) {
    content = "import ArraiaTicketCheckout from './ArraiaTicketCheckout';\n" + content;
}

// 2. Remove MercadoPago and Supabase init
content = content.replace(/import \{ initMercadoPago, Payment \} from '@mercadopago\/sdk-react';\s*initMercadoPago[^\n]*\n\s*/s, '');
content = content.replace(/const SUPABASE_URL[^\n]*\nconst SUPABASE_ANON_KEY[^\n]*\n/s, '');

// 3. Remove all form states up to pollingRef
content = content.replace(/const \[formData, setFormData\][^;]*;[\s\S]*?const pollingRef = useRef<ReturnType<typeof setInterval> \| null>\(null\);/s, '');

// 4. Remove currentPrices, total, mpInitialization, mpCustomization
content = content.replace(/const currentPrices = [\s\S]*?\}\), \[\]\);/s, '');

// 5. Remove PIX countdown timer to onCardPaymentSubmit
content = content.replace(/\/\/ PIX countdown timer[\s\S]*?\}, \[onCardPaymentSubmit\]\);/s, '');

// 6. Remove copyPixCode and variables
content = content.replace(/const copyPixCode = \(\) => \{[\s\S]*?const pixSeconds = String\(pixTimeLeft % 60\)\.padStart\(2, '0'\);/s, '');

// 7. Remove Payment Overlays JSX
content = content.replace(/\{\/\* ===== Payment Overlays[\s\S]*?\}\s*\{\/\* Navigation Header \*\//s, '{/* Navigation Header */}');

// 8. Replace Lotes + Checkout with <ArraiaTicketCheckout />
// We replace everything from "<div className=\"flex flex-col md:flex-row gap-6\">" to just before "NOVA SEÇÃO 1: O QUE TE ESPERA NO ARRAIÁ"
content = content.replace(/<div className=\"flex flex-col md:flex-row gap-6\">[\s\S]*?\{\/\* NOVA SEÇÃO 1: O QUE TE ESPERA NO ARRAIÁ \*\//s, '<ArraiaTicketCheckout />\n\n            {/* NOVA SEÇÃO 1: O QUE TE ESPERA NO ARRAIÁ */');

// 9. Update links and scrollToTickets
content = content.replace(/<a href=\"#checkout-form\" onClick=\{scrollToTickets\} className=\"hidden md:block\">/g, '<Link to=\"/arraia-2026/ingressos\" className=\"hidden md:block\">');
content = content.replace(/<a href=\"#checkout-form\" onClick=\{scrollToTickets\} className=\"inline-block relative group\">/g, '<Link to=\"/arraia-2026/ingressos\" className=\"inline-block relative group\">');

// 10. Clean up closing tags for a replaced links
content = content.replace(/<\/a>\s*<\/nav>/g, '</Link>\n            </nav>');
content = content.replace(/<span className=\"absolute inset-0 w-full h-full[\s\S]*?<\/a>/, '<span className=\"absolute inset-0 w-full h-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] rounded-xl\"></span>\n                                <span className=\"relative\">🎟️ GARANTIR MEU INGRESSO AGORA</span>\n                            </button>\n                        </Link>');


fs.writeFileSync('components/arraia2026/Arraia2026PreLaunch.tsx', content);
console.log('Refactoring completed successfully.');
