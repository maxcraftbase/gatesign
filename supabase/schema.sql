-- Drop old tables if they exist
DROP TABLE IF EXISTS check_ins CASCADE;
DROP TABLE IF EXISTS briefing_confirmations CASCADE;
DROP TABLE IF EXISTS briefing_translations CASCADE;
DROP TABLE IF EXISTS safety_briefings CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- Check-in records
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  driver_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'de',
  briefing_accepted BOOLEAN NOT NULL DEFAULT false,
  briefing_accepted_at TIMESTAMPTZ,
  briefing_version TEXT,
  has_signature BOOLEAN DEFAULT false,
  signature_data TEXT,
  reference_number TEXT
);

-- Safety briefing content per language
CREATE TABLE IF NOT EXISTS safety_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(language, version)
);

-- App configuration
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default safety briefing texts (insert for all 10 languages)
INSERT INTO safety_briefings (language, content, version) VALUES
('de', E'# Sicherheitsbelehrung\n\nBitte beachten Sie folgende Sicherheitsregeln auf unserem Betriebsgelände:\n\n1. **Schutzausrüstung:** Sicherheitsschuhe und Warnweste sind auf dem gesamten Gelände Pflicht.\n2. **Geschwindigkeit:** Maximal 10 km/h auf dem Betriebsgelände.\n3. **Rauchen:** Rauchen ist nur in den ausgewiesenen Bereichen erlaubt.\n4. **Sicherheitsbereiche:** Betreten Sie nur die für Sie freigegebenen Bereiche.\n5. **Notfall:** Im Notfall wählen Sie die 112. Sammelplatz ist am Haupteingang.\n6. **Anweisungen:** Folgen Sie den Anweisungen des Empfangspersonals.\n\nMit Ihrer Bestätigung erklären Sie, diese Regeln gelesen und verstanden zu haben.', '1.0'),
('en', E'# Safety Briefing\n\nPlease observe the following safety rules on our premises:\n\n1. **Protective equipment:** Safety shoes and high-visibility vest are mandatory on all premises.\n2. **Speed:** Maximum 10 km/h on company grounds.\n3. **Smoking:** Smoking is only permitted in designated areas.\n4. **Safety zones:** Only enter areas authorized for you.\n5. **Emergency:** In case of emergency call 112. Assembly point is at the main entrance.\n6. **Instructions:** Follow the instructions of reception staff.\n\nBy confirming, you declare that you have read and understood these rules.', '1.0'),
('pl', E'# Instrukcja bezpieczeństwa\n\nProsimy o przestrzeganie następujących zasad bezpieczeństwa na naszym terenie:\n\n1. **Wyposażenie ochronne:** Obuwie ochronne i kamizelka odblaskowa są obowiązkowe na terenie całego zakładu.\n2. **Prędkość:** Maksymalnie 10 km/h na terenie zakładu.\n3. **Palenie:** Palenie jest dozwolone tylko w wyznaczonych miejscach.\n4. **Strefy bezpieczeństwa:** Wchodź tylko do obszarów, do których masz dostęp.\n5. **Nagłe wypadki:** W nagłych wypadkach dzwoń 112. Punkt zbiórki przy wejściu głównym.\n6. **Instrukcje:** Postępuj zgodnie z instrukcjami personelu recepcji.\n\nPotwierdzając, oświadczasz, że przeczytałeś i zrozumiałeś te zasady.', '1.0'),
('ro', E'# Instructaj de securitate\n\nVă rugăm să respectați următoarele reguli de securitate pe teritoriul nostru:\n\n1. **Echipament de protecție:** Încălțămintea de protecție și vesta reflectorizantă sunt obligatorii pe întregul teritoriu.\n2. **Viteză:** Maximum 10 km/h pe teritoriul companiei.\n3. **Fumat:** Fumatul este permis doar în zonele desemnate.\n4. **Zone de siguranță:** Intrați doar în zonele autorizate pentru dvs.\n5. **Urgențe:** În caz de urgență sunați 112. Punctul de adunare este la intrarea principală.\n6. **Instrucțiuni:** Urmați instrucțiunile personalului de recepție.\n\nPrin confirmare, declarați că ați citit și înțeles aceste reguli.', '1.0'),
('cs', E'# Bezpečnostní školení\n\nDodržujte prosím následující bezpečnostní pravidla v našem areálu:\n\n1. **Ochranné vybavení:** Bezpečnostní obuv a reflexní vesta jsou povinné v celém areálu.\n2. **Rychlost:** Maximálně 10 km/h v areálu společnosti.\n3. **Kouření:** Kouření je povoleno pouze ve vyhrazených prostorách.\n4. **Bezpečnostní zóny:** Vstupujte pouze do oblastí, které jsou pro vás povoleny.\n5. **Nouzové situace:** V nouzové situaci volejte 112. Sraz je u hlavního vchodu.\n6. **Pokyny:** Dodržujte pokyny recepčního personálu.\n\nPotvrzením prohlašujete, že jste si tato pravidla přečetli a porozuměli jim.', '1.0'),
('hu', E'# Biztonsági oktatás\n\nKérjük, tartsa be a következő biztonsági szabályokat telephelyünkön:\n\n1. **Védőfelszerelés:** Biztonsági cipő és láthatósági mellény kötelező az egész területen.\n2. **Sebesség:** Legfeljebb 10 km/h a vállalat területén.\n3. **Dohányzás:** Dohányozni csak a kijelölt területeken szabad.\n4. **Biztonsági zónák:** Csak az Ön számára engedélyezett területekre lépjen be.\n5. **Vészhelyzet:** Vészhelyzetben hívja a 112-t. A gyülekezési pont a főbejáratnál van.\n6. **Utasítások:** Kövesse a recepciós személyzet utasításait.\n\nMegerősítésével kijelenti, hogy elolvasta és megértette ezeket a szabályokat.', '1.0'),
('bg', E'# Инструктаж по безопасност\n\nМоля, спазвайте следните правила за безопасност на нашата територия:\n\n1. **Предпазно оборудване:** Предпазни обувки и светлоотразителна жилетка са задължителни на цялата територия.\n2. **Скорост:** Максимум 10 км/ч на територията на компанията.\n3. **Тютюнопушене:** Пушенето е разрешено само в определените места.\n4. **Зони за безопасност:** Влизайте само в зоните, разрешени за вас.\n5. **Аварии:** При аварийна ситуация се обадете на 112. Сборният пункт е при главния вход.\n6. **Инструкции:** Следвайте инструкциите на персонала на рецепцията.\n\nС потвърждението си декларирате, че сте прочели и разбрали тези правила.', '1.0'),
('uk', E'# Інструктаж з безпеки\n\nБудь ласка, дотримуйтесь наступних правил безпеки на нашій території:\n\n1. **Захисне спорядження:** Захисне взуття та світловідбивний жилет обов''язкові на всій території.\n2. **Швидкість:** Максимум 10 км/год на території компанії.\n3. **Куріння:** Куріння дозволено лише у відведених місцях.\n4. **Зони безпеки:** Входьте лише в зони, дозволені для вас.\n5. **Надзвичайні ситуації:** У надзвичайній ситуації телефонуйте 112. Місце збору біля головного входу.\n6. **Інструкції:** Дотримуйтесь вказівок персоналу рецепції.\n\nПідтверджуючи, ви заявляєте, що прочитали та зрозуміли ці правила.', '1.0'),
('ru', E'# Инструктаж по безопасности\n\nПожалуйста, соблюдайте следующие правила безопасности на нашей территории:\n\n1. **Защитное снаряжение:** Защитная обувь и светоотражающий жилет обязательны на всей территории.\n2. **Скорость:** Максимум 10 км/ч на территории компании.\n3. **Курение:** Курение разрешено только в отведённых местах.\n4. **Зоны безопасности:** Заходите только в зоны, разрешённые для вас.\n5. **Чрезвычайные ситуации:** В чрезвычайной ситуации звоните 112. Место сбора у главного входа.\n6. **Инструкции:** Следуйте указаниям персонала ресепшн.\n\nПодтверждая, вы заявляете, что прочитали и поняли эти правила.', '1.0'),
('tr', E'# Güvenlik Eğitimi\n\nLütfen tesisimizde aşağıdaki güvenlik kurallarına uyunuz:\n\n1. **Koruyucu ekipman:** Güvenlik ayakkabısı ve yansıtıcı yelek tüm tesis genelinde zorunludur.\n2. **Hız:** Şirket alanında maksimum 10 km/saat.\n3. **Sigara:** Sigara içmek yalnızca belirlenen alanlarda serbesttir.\n4. **Güvenlik bölgeleri:** Yalnızca size izin verilen alanlara giriniz.\n5. **Acil durumlar:** Acil durumda 112''yi arayın. Toplanma noktası ana girişte.\n6. **Talimatlar:** Resepsiyon personelinin talimatlarına uyunuz.\n\nOnaylayarak bu kuralları okuduğunuzu ve anladığınızı beyan edersiniz.', '1.0')
ON CONFLICT (language, version) DO NOTHING;

-- Default app settings
INSERT INTO app_settings (key, value) VALUES
('welcome_title', 'Willkommen / Welcome'),
('welcome_subtitle', 'Bitte melden Sie sich hier an — Please register here'),
('signature_required', 'false'),
('site_info', ''),
('briefing_version', '1.0')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- check_ins: anyone can insert, only authenticated can read
CREATE POLICY "public insert check_ins" ON check_ins FOR INSERT WITH CHECK (true);
CREATE POLICY "authenticated read check_ins" ON check_ins FOR SELECT USING (auth.role() = 'authenticated');

-- safety_briefings: public read, authenticated write
CREATE POLICY "public read briefings" ON safety_briefings FOR SELECT USING (true);
CREATE POLICY "authenticated write briefings" ON safety_briefings FOR ALL USING (auth.role() = 'authenticated');

-- app_settings: public read, authenticated write
CREATE POLICY "public read settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "authenticated write settings" ON app_settings FOR ALL USING (auth.role() = 'authenticated');
