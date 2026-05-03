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
  visitor_type TEXT NOT NULL DEFAULT 'truck', -- 'truck' | 'visitor' | 'service'
  driver_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  trailer_plate TEXT,
  phone TEXT,
  contact_person TEXT,
  language TEXT NOT NULL DEFAULT 'de',
  briefing_accepted BOOLEAN NOT NULL DEFAULT false,
  briefing_accepted_at TIMESTAMPTZ,
  briefing_version TEXT,
  has_signature BOOLEAN DEFAULT false,
  signature_data TEXT,
  reference_number TEXT
);

-- Safety briefing content per language and visitor type
CREATE TABLE IF NOT EXISTS safety_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  visitor_type TEXT NOT NULL DEFAULT 'truck', -- 'truck' | 'visitor' | 'service'
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(language, visitor_type, version)
);

-- App configuration
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default safety briefing texts — truck (all 10 languages)
INSERT INTO safety_briefings (language, visitor_type, content, version) VALUES
('de','truck', E'# Sicherheitsbelehrung LKW\n\nBitte beachten Sie folgende Sicherheitsregeln auf unserem Betriebsgelände:\n\n1. **Schutzausrüstung:** Sicherheitsschuhe und Warnweste sind auf dem gesamten Gelände Pflicht.\n2. **Geschwindigkeit:** Maximal 10 km/h auf dem Betriebsgelände.\n3. **Rauchen:** Rauchen ist nur in den ausgewiesenen Bereichen erlaubt.\n4. **Fahrzeug:** Verlassen Sie das Fahrzeug erst nach Aufforderung. Am Fahrzeug bleiben bis zur Entladung.\n5. **Sicherheitsbereiche:** Betreten Sie nur die für Sie freigegebenen Bereiche. Kein Zutritt zu Lager und Produktion.\n6. **Notfall:** Im Notfall wählen Sie die 112. Sammelplatz ist am Haupteingang.\n7. **Anweisungen:** Folgen Sie den Anweisungen des Empfangspersonals.\n\nMit Ihrer Bestätigung erklären Sie, diese Regeln gelesen und verstanden zu haben.', '1.0'),
('en','truck', E'# Safety Briefing — Truck\n\nPlease observe the following safety rules on our premises:\n\n1. **Protective equipment:** Safety shoes and high-visibility vest are mandatory on all premises.\n2. **Speed:** Maximum 10 km/h on company grounds.\n3. **Smoking:** Smoking is only permitted in designated areas.\n4. **Vehicle:** Do not leave the vehicle until instructed. Stay with the vehicle during unloading.\n5. **Safety zones:** Only enter areas authorized for you. No access to warehouse and production.\n6. **Emergency:** In case of emergency call 112. Assembly point is at the main entrance.\n7. **Instructions:** Follow the instructions of reception staff.\n\nBy confirming, you declare that you have read and understood these rules.', '1.0'),
('pl','truck', E'# Instrukcja bezpieczeństwa — Ciężarówka\n\nProsimy o przestrzeganie następujących zasad bezpieczeństwa na naszym terenie:\n\n1. **Wyposażenie ochronne:** Obuwie ochronne i kamizelka odblaskowa są obowiązkowe.\n2. **Prędkość:** Maksymalnie 10 km/h na terenie zakładu.\n3. **Palenie:** Palenie jest dozwolone tylko w wyznaczonych miejscach.\n4. **Pojazd:** Nie opuszczaj pojazdu bez wezwania. Pozostań przy pojeździe podczas rozładunku.\n5. **Strefy bezpieczeństwa:** Wchodź tylko do obszarów, do których masz dostęp. Brak dostępu do magazynu i produkcji.\n6. **Nagłe wypadki:** W nagłych wypadkach dzwoń 112. Punkt zbiórki przy wejściu głównym.\n7. **Instrukcje:** Postępuj zgodnie z instrukcjami personelu recepcji.\n\nPotwierdzając, oświadczasz, że przeczytałeś i zrozumiałeś te zasady.', '1.0'),
('ro','truck', E'# Instructaj de securitate — Camion\n\nVă rugăm să respectați următoarele reguli de securitate pe teritoriul nostru:\n\n1. **Echipament de protecție:** Încălțămintea de protecție și vesta reflectorizantă sunt obligatorii.\n2. **Viteză:** Maximum 10 km/h pe teritoriul companiei.\n3. **Fumat:** Fumatul este permis doar în zonele desemnate.\n4. **Vehicul:** Nu părăsiți vehiculul fără instrucțiuni. Rămâneți lângă vehicul în timpul descărcării.\n5. **Zone de siguranță:** Intrați doar în zonele autorizate. Fără acces la depozit și producție.\n6. **Urgențe:** În caz de urgență sunați 112. Punctul de adunare este la intrarea principală.\n7. **Instrucțiuni:** Urmați instrucțiunile personalului de recepție.\n\nPrin confirmare, declarați că ați citit și înțeles aceste reguli.', '1.0'),
('cs','truck', E'# Bezpečnostní školení — Nákladní vozidlo\n\nDodržujte prosím následující bezpečnostní pravidla v našem areálu:\n\n1. **Ochranné vybavení:** Bezpečnostní obuv a reflexní vesta jsou povinné.\n2. **Rychlost:** Maximálně 10 km/h v areálu společnosti.\n3. **Kouření:** Kouření je povoleno pouze ve vyhrazených prostorách.\n4. **Vozidlo:** Neopouštějte vozidlo bez výzvy. Zůstaňte u vozidla během vykládky.\n5. **Bezpečnostní zóny:** Vstupujte pouze do povolených oblastí. Zákaz vstupu do skladu a výroby.\n6. **Nouzové situace:** V nouzové situaci volejte 112. Sraz je u hlavního vchodu.\n7. **Pokyny:** Dodržujte pokyny recepčního personálu.\n\nPotvrzením prohlašujete, že jste si tato pravidla přečetli a porozuměli jim.', '1.0'),
('hu','truck', E'# Biztonsági oktatás — Tehergépjármű\n\nKérjük, tartsa be a következő biztonsági szabályokat telephelyünkön:\n\n1. **Védőfelszerelés:** Biztonsági cipő és láthatósági mellény kötelező.\n2. **Sebesség:** Legfeljebb 10 km/h a vállalat területén.\n3. **Dohányzás:** Dohányozni csak a kijelölt területeken szabad.\n4. **Jármű:** Ne hagyja el a járművet felszólítás nélkül. Maradjon a járműnél a lerakodás során.\n5. **Biztonsági zónák:** Csak az engedélyezett területekre lépjen be. Nincs hozzáférés a raktárhoz és a termeléshez.\n6. **Vészhelyzet:** Vészhelyzetben hívja a 112-t. A gyülekezési pont a főbejáratnál van.\n7. **Utasítások:** Kövesse a recepciós személyzet utasításait.\n\nMegerősítésével kijelenti, hogy elolvasta és megértette ezeket a szabályokat.', '1.0'),
('bg','truck', E'# Инструктаж по безопасност — Камион\n\nМоля, спазвайте следните правила за безопасност на нашата територия:\n\n1. **Предпазно оборудване:** Предпазни обувки и светлоотразителна жилетка са задължителни.\n2. **Скорост:** Максимум 10 км/ч на територията на компанията.\n3. **Тютюнопушене:** Пушенето е разрешено само в определените места.\n4. **Превозно средство:** Не напускайте превозното средство без покана. Останете при него по време на разтоварване.\n5. **Зони за безопасност:** Влизайте само в разрешените зони. Забранен достъп до склад и производство.\n6. **Аварии:** При аварийна ситуация се обадете на 112. Сборният пункт е при главния вход.\n7. **Инструкции:** Следвайте инструкциите на персонала на рецепцията.\n\nС потвърждението си декларирате, че сте прочели и разбрали тези правила.', '1.0'),
('uk','truck', E'# Інструктаж з безпеки — Вантажівка\n\nБудь ласка, дотримуйтесь наступних правил безпеки на нашій території:\n\n1. **Захисне спорядження:** Захисне взуття та світловідбивний жилет обов''язкові.\n2. **Швидкість:** Максимум 10 км/год на території компанії.\n3. **Куріння:** Куріння дозволено лише у відведених місцях.\n4. **Транспортний засіб:** Не покидайте транспортний засіб без вказівки. Залишайтесь біля нього під час розвантаження.\n5. **Зони безпеки:** Входьте лише в дозволені зони. Немає доступу до складу та виробництва.\n6. **Надзвичайні ситуації:** У надзвичайній ситуації телефонуйте 112. Місце збору біля головного входу.\n7. **Інструкції:** Дотримуйтесь вказівок персоналу рецепції.\n\nПідтверджуючи, ви заявляєте, що прочитали та зрозуміли ці правила.', '1.0'),
('ru','truck', E'# Инструктаж по безопасности — Грузовик\n\nПожалуйста, соблюдайте следующие правила безопасности на нашей территории:\n\n1. **Защитное снаряжение:** Защитная обувь и светоотражающий жилет обязательны.\n2. **Скорость:** Максимум 10 км/ч на территории компании.\n3. **Курение:** Курение разрешено только в отведённых местах.\n4. **Транспортное средство:** Не покидайте транспортное средство без команды. Оставайтесь рядом во время разгрузки.\n5. **Зоны безопасности:** Заходите только в разрешённые зоны. Нет доступа на склад и в производство.\n6. **Чрезвычайные ситуации:** В чрезвычайной ситуации звоните 112. Место сбора у главного входа.\n7. **Инструкции:** Следуйте указаниям персонала ресепшн.\n\nПодтверждая, вы заявляете, что прочитали и поняли эти правила.', '1.0'),
('tr','truck', E'# Güvenlik Eğitimi — Kamyon\n\nLütfen tesisimizde aşağıdaki güvenlik kurallarına uyunuz:\n\n1. **Koruyucu ekipman:** Güvenlik ayakkabısı ve yansıtıcı yelek zorunludur.\n2. **Hız:** Şirket alanında maksimum 10 km/saat.\n3. **Sigara:** Sigara içmek yalnızca belirlenen alanlarda serbesttir.\n4. **Araç:** Çağrılmadan araçtan çıkmayın. Boşaltma sırasında araçta kalın.\n5. **Güvenlik bölgeleri:** Yalnızca izin verilen alanlara girin. Depo ve üretime erişim yasaktır.\n6. **Acil durumlar:** Acil durumda 112''yi arayın. Toplanma noktası ana girişte.\n7. **Talimatlar:** Resepsiyon personelinin talimatlarına uyunuz.\n\nOnaylayarak bu kuralları okuduğunuzu ve anladığınızı beyan edersiniz.', '1.0')
ON CONFLICT (language, visitor_type, version) DO NOTHING;

-- Default safety briefing texts — visitor (DE + EN, others fallback to truck)
INSERT INTO safety_briefings (language, visitor_type, content, version) VALUES
('de','visitor', E'# Sicherheitshinweise Besucher\n\nWillkommen auf unserem Betriebsgelände. Bitte beachten Sie folgende Hinweise:\n\n1. **Ausweis:** Bitte führen Sie immer Ihren Ausweis mit sich.\n2. **Geschwindigkeit:** Maximal 10 km/h auf dem Betriebsgelände.\n3. **Rauchen:** Rauchen ist nur in den ausgewiesenen Bereichen erlaubt.\n4. **Begleitung:** Besucher dürfen das Gelände nur in Begleitung eines Mitarbeiters betreten.\n5. **Sicherheitsbereiche:** Betreten Sie nur die für Sie freigegebenen Bereiche.\n6. **Notfall:** Im Notfall wählen Sie die 112. Sammelplatz ist am Haupteingang.\n7. **Anweisungen:** Folgen Sie den Anweisungen des Empfangspersonals.\n\nMit Ihrer Bestätigung erklären Sie, diese Hinweise gelesen und verstanden zu haben.', '1.0'),
('en','visitor', E'# Safety Instructions — Visitor\n\nWelcome to our premises. Please observe the following guidelines:\n\n1. **ID:** Please carry your identification at all times.\n2. **Speed:** Maximum 10 km/h on company grounds.\n3. **Smoking:** Smoking is only permitted in designated areas.\n4. **Escort:** Visitors may only access the premises accompanied by an employee.\n5. **Safety zones:** Only enter areas authorized for you.\n6. **Emergency:** In case of emergency call 112. Assembly point is at the main entrance.\n7. **Instructions:** Follow the instructions of reception staff.\n\nBy confirming, you declare that you have read and understood these guidelines.', '1.0')
ON CONFLICT (language, visitor_type, version) DO NOTHING;

-- Default safety briefing texts — service (DE + EN, others fallback to truck)
INSERT INTO safety_briefings (language, visitor_type, content, version) VALUES
('de','service', E'# Sicherheitshinweise Dienstleister\n\nBitte beachten Sie folgende Sicherheitsregeln auf unserem Betriebsgelände:\n\n1. **Schutzausrüstung:** Sicherheitsschuhe und Warnweste sind auf dem gesamten Gelände Pflicht.\n2. **Ausweis:** Bitte führen Sie immer Ihren Ausweis und Ihre Auftragsunterlagen mit sich.\n3. **Geschwindigkeit:** Maximal 10 km/h auf dem Betriebsgelände.\n4. **Rauchen:** Rauchen ist nur in den ausgewiesenen Bereichen erlaubt.\n5. **Arbeitsbereich:** Arbeiten Sie nur in dem für Ihren Auftrag freigegebenen Bereich.\n6. **Anweisungen beachten:** Folgen Sie den Hinweisen und Anweisungen des zuständigen Mitarbeiters.\n7. **Notfall:** Im Notfall wählen Sie die 112. Sammelplatz ist am Haupteingang.\n\nMit Ihrer Bestätigung erklären Sie, diese Regeln gelesen und verstanden zu haben.', '1.0'),
('en','service', E'# Safety Instructions — Service Provider\n\nPlease observe the following safety rules on our premises:\n\n1. **Protective equipment:** Safety shoes and high-visibility vest are mandatory on all premises.\n2. **ID:** Please carry your identification and work order at all times.\n3. **Speed:** Maximum 10 km/h on company grounds.\n4. **Smoking:** Smoking is only permitted in designated areas.\n5. **Work area:** Only work in the area authorized for your assignment.\n6. **Follow instructions:** Follow the guidance of the responsible employee.\n7. **Emergency:** In case of emergency call 112. Assembly point is at the main entrance.\n\nBy confirming, you declare that you have read and understood these rules.', '1.0')
ON CONFLICT (language, visitor_type, version) DO NOTHING;

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
