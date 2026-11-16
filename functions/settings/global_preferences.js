(function () {
    "use strict";

    const THEME_KEY = "snap-theme";
    const LANGUAGE_KEY = "snap-language";
    const supportedLanguages = ["en", "fil", "es", "ja", "zh-CN"];
    const english = {
        "Home": ["Tahanan", "Inicio", "ホーム", "首页"],
        "Tasks": ["Mga Gawain", "Tareas", "タスク", "任务"],
        "AI & Chat": ["AI at Chat", "IA y chat", "AI・チャット", "AI 与聊天"],
        "Badge": ["Mga Badge", "Insignias", "バッジ", "徽章"],
        "Profile": ["Profile", "Perfil", "プロフィール", "个人资料"],
        "Recent Notes": ["Mga Kamakailang Tala", "Notas recientes", "最近のノート", "最近的笔记"],
        "Settings": ["Mga Setting", "Configuración", "設定", "设置"],
        "Account Settings": ["Mga Setting ng Account", "Configuración de la cuenta", "アカウント設定", "账户设置"],
        "Notification Settings": ["Mga Setting ng Notification", "Configuración de notificaciones", "通知設定", "通知设置"],
        "Language": ["Wika", "Idioma", "言語", "语言"],
        "Dark Mode": ["Madilim na Mode", "Modo oscuro", "ダークモード", "深色模式"],
        "Dark mode on": ["Madilim na mode na naka-on", "Modo oscuro activado", "ダークモード：オン", "深色模式：开"],
        "Dark mode off": ["Madilim na mode na naka-off", "Modo oscuro desactivado", "ダークモード：オフ", "深色模式：关"],
        "Help & Support": ["Tulong at Suporta", "Ayuda y soporte", "ヘルプとサポート", "帮助与支持"],
        "About": ["Tungkol sa", "Acerca de", "アプリについて", "关于"],
        "Log Out": ["Mag-log out", "Cerrar sesión", "ログアウト", "退出登录"],
        "Email": ["Email", "Correo electrónico", "メールアドレス", "电子邮件"],
        "Level 12 - Focus Learner": ["Antas 12 - Masigasig na Mag-aaral", "Nivel 12 - Estudiante enfocado", "レベル12 - 集中学習者", "等级 12 - 专注学习者"],
        "Preferred language": ["Piniling wika", "Idioma preferido", "優先する言語", "首选语言"],
        "English": ["Ingles", "Inglés", "英語", "英语"],
        "English (US)": ["Ingles (US)", "Inglés (EE. UU.)", "英語（米国）", "英语（美国）"],
        "Filipino": ["Filipino", "Filipino", "フィリピノ語", "菲律宾语"],
        "Spanish": ["Espanyol", "Español", "スペイン語", "西班牙语"],
        "Japanese": ["Hapon", "Japonés", "日本語", "日语"],
        "Chinese (Simplified)": ["Tsino (Pinasimple)", "Chino (simplificado)", "中国語（簡体字）", "简体中文"],
        "Save changes": ["I-save ang mga pagbabago", "Guardar cambios", "変更を保存", "保存更改"],
        "Cancel": ["Kanselahin", "Cancelar", "キャンセル", "取消"],
        "Edit": ["I-edit", "Editar", "編集", "编辑"],
        "Delete Account": ["Tanggalin ang Account", "Eliminar cuenta", "アカウントを削除", "删除账户"],
        "First name": ["Pangalan", "Nombre", "名", "名字"],
        "Middle name/Initial": ["Gitnang pangalan/Inisyal", "Segundo nombre/inicial", "ミドルネーム/イニシャル", "中间名/首字母"],
        "Last name": ["Apelyido", "Apellido", "姓", "姓氏"],
        "University": ["Unibersidad", "Universidad", "大学", "大学"],
        "Email address": ["Email address", "Correo electrónico", "メールアドレス", "电子邮件地址"],
        "Username": ["Username", "Nombre de usuario", "ユーザー名", "用户名"],
        "Password": ["Password", "Contraseña", "パスワード", "密码"],
        "Are you sure?": ["Sigurado ka ba?", "¿Estás seguro?", "よろしいですか？", "确定吗？"],
        "Yes": ["Oo", "Sí", "はい", "是"],
        "No": ["Hindi", "No", "いいえ", "否"],
        "Daily": ["Araw-araw", "Diario", "毎日", "每天"],
        "Weekly": ["Lingguhan", "Semanal", "毎週", "每周"],
        "Every 2 days": ["Tuwing 2 araw", "Cada 2 días", "2日ごと", "每 2 天"],
        "Default reminder lead time": ["Default na agwat bago ang paalala", "Antelación predeterminada del recordatorio", "リマインダーの標準通知時刻", "默认提醒提前时间"],
        "Applies to new tasks; existing tasks keep their selected reminder.": ["Para ito sa mga bagong gawain; mananatili ang napiling paalala ng mga kasalukuyang gawain.", "Se aplica a tareas nuevas; las existentes conservan su recordatorio.", "新しいタスクに適用されます。既存のタスクの設定は変わりません。", "适用于新任务；现有任务保留已选提醒。"],
        "Email notifications": ["Mga notification sa email", "Notificaciones por correo", "メール通知", "电子邮件通知"],
        "Push reminders": ["Mga push reminder", "Recordatorios push", "プッシュ通知", "推送提醒"],
        "Weekly summary": ["Lingguhang buod", "Resumen semanal", "週間サマリー", "每周摘要"],
        "Reminder timing": ["Oras ng paalala", "Frecuencia del recordatorio", "リマインダーの頻度", "提醒频率"],
        "My Tasks": ["Aking mga Gawain", "Mis tareas", "自分のタスク", "我的任务"],
        "New task": ["Bagong gawain", "Nueva tarea", "新しいタスク", "新建任务"],
        "Search tasks": ["Maghanap ng gawain", "Buscar tareas", "タスクを検索", "搜索任务"],
        "In Progress": ["Isinasagawa", "En progreso", "進行中", "进行中"],
        "Overdue": ["Lampas sa takdang oras", "Atrasadas", "期限超過", "已逾期"],
        "Completed": ["Nakumpleto", "Completadas", "完了", "已完成"],
        "Level": ["Antas", "Nivel", "レベル", "等级"],
        "XP": ["XP", "XP", "XP", "XP"],
        "Loading profile...": ["Naglo-load ng profile...", "Cargando perfil...", "プロフィールを読み込み中...", "正在加载个人资料..."],
        "Loading progress...": ["Naglo-load ng progreso...", "Cargando progreso...", "進行状況を読み込み中...", "正在加载进度..."],
        "Loading university...": ["Naglo-load ng unibersidad...", "Cargando universidad...", "大学情報を読み込み中...", "正在加载学校信息..."],
        "Loading email...": ["Naglo-load ng email...", "Cargando correo...", "メールアドレスを読み込み中...", "正在加载电子邮件..."],
        "Level unavailable": ["Hindi available ang antas", "Nivel no disponible", "レベルを取得できません", "等级暂不可用"],
        "Track your progress, unlock badges, and celebrate milestones.": ["Subaybayan ang progreso, mag-unlock ng badge, at ipagdiwang ang mga tagumpay.", "Sigue tu progreso, desbloquea insignias y celebra tus logros.", "進捗を確認し、バッジを獲得して、達成を祝いましょう。", "跟踪进度、解锁徽章并庆祝里程碑。"],
        "Your Level": ["Iyong Antas", "Tu nivel", "あなたのレベル", "你的等级"],
        "Keep earning XP to level up and unlock new rewards.": ["Patuloy na kumita ng XP para tumaas ang antas at mag-unlock ng mga gantimpala.", "Sigue ganando XP para subir de nivel y desbloquear recompensas.", "XPを獲得してレベルアップし、新しい報酬を解放しましょう。", "继续赚取 XP 以升级并解锁新奖励。"],
        "Next level:": ["Susunod na antas:", "Siguiente nivel:", "次のレベル：", "下一级："],
        "Total XP earned:": ["Kabuuang XP na nakuha:", "XP total obtenido:", "獲得XP合計：", "累计获得 XP："],
        "Badges": ["Mga Badge", "Insignias", "バッジ", "徽章"],
        "unlocked": ["na-unlock", "desbloqueadas", "解除済み", "已解锁"],
        "Milestones": ["Mga Milestone", "Hitos", "マイルストーン", "里程碑"],
        "from the way you learn and organize in SNAP.": ["mula sa paraan ng iyong pag-aaral at pag-aayos sa SNAP.", "por cómo aprendes y te organizas en SNAP.", "SNAPでの学習や整理を通じて達成しましょう。", "记录你在 SNAP 中学习和整理时取得的里程碑。"],
        "No active tasks yet.": ["Wala pang aktibong gawain.", "Aún no hay tareas activas.", "進行中のタスクはありません。", "目前没有进行中的任务。"],
        "No overdue tasks.": ["Walang lampas sa takdang oras.", "No hay tareas atrasadas.", "期限を過ぎたタスクはありません。", "没有逾期任务。"],
        "No completed tasks yet.": ["Wala pang nakumpletong gawain.", "Aún no hay tareas completadas.", "完了したタスクはまだありません。", "还没有已完成的任务。"],
        "No notes yet.": ["Wala pang mga tala.", "Aún no hay notas.", "ノートはまだありません。", "还没有笔记。"],
        "All notes": ["Lahat ng tala", "Todas las notas", "すべてのノート", "所有笔记"],
        "Notes you delete will appear here.": ["Lalabas dito ang mga tinanggal mong tala.", "Las notas que elimines aparecerán aquí.", "削除したノートはここに表示されます。", "删除的笔记会显示在这里。"],
        "Nothing here": ["Walang laman dito", "No hay nada aquí", "ここには何もありません", "这里没有内容"],
        "Deleted notes will appear here so you can restore them later.": ["Lalabas dito ang mga tinanggal na tala upang maibalik mo ang mga ito sa ibang pagkakataon.", "Las notas eliminadas aparecerán aquí para que puedas restaurarlas más tarde.", "削除したノートはここに表示され、後で復元できます。", "删除的笔记会显示在这里，供你稍后恢复。"],
        "Delete note?": ["Tanggalin ang tala?", "¿Eliminar nota?", "ノートを削除しますか？", "删除笔记？"],
        "Are you sure you want to continue?": ["Sigurado ka bang gusto mong magpatuloy?", "¿Seguro que quieres continuar?", "続行してもよろしいですか？", "确定要继续吗？"],
        "Empty Trash": ["Alisan ng laman ang basurahan", "Vaciar papelera", "ゴミ箱を空にする", "清空回收站"],
        "Conversations": ["Mga pag-uusap", "Conversaciones", "会話", "对话"],
        "Loading your conversations…": ["Naglo-load ng mga pag-uusap...", "Cargando tus conversaciones...", "会話を読み込み中...", "正在加载对话..."],
        "Loading messages…": ["Naglo-load ng mga mensahe...", "Cargando mensajes...", "メッセージを読み込み中...", "正在加载消息..."],
        "Your study conversations": ["Mga pag-uusap mo sa pag-aaral", "Tus conversaciones de estudio", "学習の会話", "你的学习对话"],
        "Select a direct or group chat, or search for a SNAP user to start a conversation.": ["Pumili ng direktang chat o grupo, o maghanap ng SNAP user para magsimula ng pag-uusap.", "Elige un chat directo o grupal, o busca a alguien de SNAP para iniciar una conversación.", "ダイレクトまたはグループチャットを選ぶか、SNAPユーザーを検索して会話を始めましょう。", "选择私聊或群聊，或搜索 SNAP 用户以开始对话。"],
        "Frequently asked questions": ["Mga madalas itanong", "Preguntas frecuentes", "よくある質問", "常见问题"],
        "Your task is due in 5 minutes.": ["Magtatapos ang takdang oras ng gawain sa loob ng 5 minuto.", "Tu tarea vence en 5 minutos.", "タスクの期限まであと5分です。", "任务将在 5 分钟后到期。"],
        "Your task is due in 15 minutes.": ["Magtatapos ang takdang oras ng gawain sa loob ng 15 minuto.", "Tu tarea vence en 15 minutos.", "タスクの期限まであと15分です。", "任务将在 15 分钟后到期。"],
        "Your task is due in 30 minutes.": ["Magtatapos ang takdang oras ng gawain sa loob ng 30 minuto.", "Tu tarea vence en 30 minutos.", "タスクの期限まであと30分です。", "任务将在 30 分钟后到期。"],
        "Your task is due in 1 hour.": ["Magtatapos ang takdang oras ng gawain sa loob ng 1 oras.", "Tu tarea vence en 1 hora.", "タスクの期限まであと1時間です。", "任务将在 1 小时后到期。"],
        "Your task is due tomorrow.": ["Bukas ang takdang oras ng gawain.", "Tu tarea vence mañana.", "タスクの期限は明日です。", "任务将于明日到期。"],
        "Your task is due soon.": ["Malapit na ang takdang oras ng gawain.", "Tu tarea vence pronto.", "まもなくタスクの期限です。", "任务即将到期。"],
        "SNAP Task Reminder": ["Paalala sa Gawain ng SNAP", "Recordatorio de tarea de SNAP", "SNAPタスクリマインダー", "SNAP 任务提醒"],
        "Task reminders are turned off in Notification Settings.": ["Naka-off ang mga paalala sa gawain sa Mga Setting ng Notification.", "Los recordatorios de tareas están desactivados en Configuración de notificaciones.", "通知設定でタスクリマインダーがオフになっています。", "通知设置中的任务提醒已关闭。"],
        "Unable to load your tasks from Firebase.": ["Hindi ma-load ang iyong mga gawain mula sa Firebase.", "No se pudieron cargar tus tareas desde Firebase.", "Firebaseからタスクを読み込めませんでした。", "无法从 Firebase 加载任务。"],
        "Please enter a valid email address.": ["Maglagay ng wastong email address.", "Introduce una dirección de correo válida.", "有効なメールアドレスを入力してください。", "请输入有效的电子邮件地址。"],
        "Unable to log out. Please try again.": ["Hindi makapag-log out. Subukan muli.", "No se pudo cerrar sesión. Inténtalo de nuevo.", "ログアウトできませんでした。もう一度お試しください。", "无法退出登录，请重试。"],
        "Signing out…": ["Nagla-log out…", "Cerrando sesión…", "ログアウト中…", "正在退出登录…"],
        "Language preview updated. Save to sync this choice to your account.": ["Na-update ang preview ng wika. I-save para i-sync ito sa iyong account.", "Vista previa del idioma actualizada. Guarda para sincronizar esta opción con tu cuenta.", "言語のプレビューを更新しました。アカウントに同期するには保存してください。", "语言预览已更新。保存以将此选择同步到你的账户。"],
        "Language preference saved.": ["Na-save ang piniling wika.", "Preferencia de idioma guardada.", "言語設定を保存しました。", "语言偏好设置已保存。"],
        "Language is active and saved on this device, but could not be synced to your account.": ["Aktibo at naka-save sa device na ito ang wika, ngunit hindi ito na-sync sa iyong account.", "El idioma está activo y guardado en este dispositivo, pero no se pudo sincronizar con tu cuenta.", "言語はこの端末で有効・保存されていますが、アカウントには同期できませんでした。", "语言已在此设备启用并保存，但无法同步到你的账户。"],
        "Language selection restored.": ["Ibinalik ang piniling wika.", "Se restauró la selección de idioma.", "言語の選択を元に戻しました。", "已恢复语言选择。"],
        "Unsaved changes were discarded.": ["Itinapon ang mga hindi na-save na pagbabago.", "Se descartaron los cambios sin guardar.", "未保存の変更を破棄しました。", "已放弃未保存的更改。"],
        "Unsaved preference.": ["Hindi pa na-save ang kagustuhan.", "Preferencia sin guardar.", "未保存の設定です。", "偏好设置尚未保存。"],
        "Notification preferences saved to your account.": ["Na-save ang mga kagustuhan sa notification sa iyong account.", "Preferencias de notificación guardadas en tu cuenta.", "通知設定をアカウントに保存しました。", "通知偏好设置已保存到你的账户。"],
        "Preferences were saved on this device, but could not be synced to your account.": ["Na-save ang mga kagustuhan sa device na ito ngunit hindi na-sync sa iyong account.", "Las preferencias se guardaron en este dispositivo, pero no se pudieron sincronizar con tu cuenta.", "設定はこの端末に保存されましたが、アカウントには同期できませんでした。", "偏好设置已保存在此设备上，但无法同步到你的账户。"],
        "Saving...": ["Nagse-save...", "Guardando...", "保存中...", "正在保存..."],
        "Your account information has been saved.": ["Na-save ang impormasyon ng iyong account.", "Se guardó la información de tu cuenta.", "アカウント情報を保存しました。", "账户信息已保存。"],
        "Your profile was saved. Check your new email address to verify the email change.": ["Na-save ang profile mo. Tingnan ang bago mong email para beripikahin ang pagbabago.", "Se guardó tu perfil. Revisa tu nuevo correo para verificar el cambio.", "プロフィールを保存しました。メールアドレスの変更を確認するため、新しいアドレスを確認してください。", "个人资料已保存。请查看新邮箱以验证地址更改。"],
        "For security, sign in again before changing your email or password.": ["Para sa seguridad, mag-sign in muli bago baguhin ang email o password.", "Por seguridad, vuelve a iniciar sesión antes de cambiar tu correo o contraseña.", "セキュリティのため、メールアドレスまたはパスワードを変更する前に再度ログインしてください。", "出于安全考虑，请重新登录后再更改电子邮件或密码。"],
        "All": ["Lahat", "Todas", "すべて", "全部"],
        "Study": ["Pag-aaral", "Estudio", "学習", "学习"],
        "Assignment": ["Takdang-aralin", "Trabajo", "課題", "作业"],
        "Quiz": ["Pagsusulit", "Prueba", "クイズ", "测验"],
        "Dashboard": ["Dashboard", "Panel", "ダッシュボード", "工作台"],
        "Achievements": ["Mga Nakamit", "Logros", "実績", "成就"],
        "Folders": ["Mga Folder", "Carpetas", "フォルダー", "文件夹"],
        "Notes": ["Mga Tala", "Notas", "ノート", "笔记"],
        "Search notes, tasks...": ["Maghanap ng tala o gawain...", "Buscar notas y tareas...", "ノートやタスクを検索...", "搜索笔记和任务..."],
        "New note": ["Bagong tala", "Nueva nota", "新しいノート", "新建笔记"],
        "All notes": ["Lahat ng tala", "Todas las notas", "すべてのノート", "所有笔记"],
        "Today": ["Ngayong araw", "Hoy", "今日", "今天"],
        "In Progress": ["Isinasagawa", "En progreso", "進行中", "进行中"],
        "Loading...": ["Naglo-load...", "Cargando...", "読み込み中...", "正在加载..."],
        "Log In": ["Mag-log in", "Iniciar sesión", "ログイン", "登录"],
        "Welcome to SNAP": ["Maligayang pagdating sa SNAP", "Te damos la bienvenida a SNAP", "SNAPへようこそ", "欢迎使用 SNAP"],
        "Learn": ["Matuto", "Aprende", "学び", "学习"],
        "smarter.": ["nang mas matalino.", "mejor.", "より賢く。", "更高效。"],
        "Write": ["Sumulat", "Escribe", "書き", "写作"],
        "better.": ["nang mas mahusay.", "mejor.", "より良く。", "更出色。"],
        "Forgot Password?": ["Nakalimutan ang password?", "¿Olvidaste tu contraseña?", "パスワードをお忘れですか？", "忘记密码？"],
        "Or continue with": ["O magpatuloy gamit ang", "O continúa con", "または次で続行", "或使用以下方式继续"],
        "Don't have an account?": ["Wala ka pang account?", "¿No tienes una cuenta?", "アカウントをお持ちでないですか？", "还没有账户？"],
        "Sign Up": ["Mag-sign up", "Registrarse", "新規登録", "注册"],
        "Google": ["Google", "Google", "Google", "Google"],
        "Facebook": ["Facebook", "Facebook", "Facebook", "Facebook"],
        "Start a new chat": ["Magsimula ng bagong chat", "Iniciar un chat", "新しいチャットを開始", "开始新聊天"],
        "SNAP Workspace": ["SNAP Workspace", "SNAP Workspace", "SNAP Workspace", "SNAP Workspace"],
        "Study, organize, and connect in one place.": ["Mag-aral, mag-ayos, at kumonekta sa iisang lugar.", "Estudia, organiza y conecta en un solo lugar.", "学習、整理、交流をひとつの場所で。", "在一个地方学习、整理和交流。"],
        "SNAP AI": ["SNAP AI", "SNAP AI", "SNAP AI", "SNAP AI"],
        "CHATS": ["MGA CHAT", "CHATS", "チャット", "聊天"],
        "Connect with friends and study together.": ["Kumonekta sa mga kaibigan at mag-aral nang sama-sama.", "Conéctate con tus amistades y estudien juntos.", "友達とつながって一緒に学習しましょう。", "与朋友联系并一起学习。"],
        "Your personal study and productivity assistant.": ["Ang iyong personal na katuwang sa pag-aaral at pagiging produktibo.", "Tu asistente personal de estudio y productividad.", "学習と生産性を支えるパーソナルアシスタント。", "你的个人学习与效率助手。"],
        "Recent": ["Kamakailan", "Recientes", "最近", "最近"],
        "Support": ["Suporta", "Soporte", "サポート", "支持"],
        "Profile | SNAP": ["Profile | SNAP", "Perfil | SNAP", "プロフィール | SNAP", "个人资料 | SNAP"],
        "Log In | SNAP": ["Mag-log in | SNAP", "Iniciar sesión | SNAP", "ログイン | SNAP", "登录 | SNAP"],
        "My Tasks | SNAP": ["Aking mga Gawain | SNAP", "Mis tareas | SNAP", "自分のタスク | SNAP", "我的任务 | SNAP"],
        "Dashboard | SNAP": ["Dashboard | SNAP", "Panel | SNAP", "ダッシュボード | SNAP", "工作台 | SNAP"],
        "Achievements | SNAP": ["Mga Nakamit | SNAP", "Logros | SNAP", "実績 | SNAP", "成就 | SNAP"],
        "Language | SNAP": ["Wika | SNAP", "Idioma | SNAP", "言語 | SNAP", "语言 | SNAP"],
        "Account Settings | SNAP": ["Mga Setting ng Account | SNAP", "Configuración de la cuenta | SNAP", "アカウント設定 | SNAP", "账户设置 | SNAP"],
        "Notification Settings | SNAP": ["Mga Setting ng Notification | SNAP", "Configuración de notificaciones | SNAP", "通知設定 | SNAP", "通知设置 | SNAP"],
        "About | SNAP": ["Tungkol sa | SNAP", "Acerca de | SNAP", "アプリについて | SNAP", "关于 | SNAP"],
        "Help & Support | SNAP": ["Tulong at Suporta | SNAP", "Ayuda y soporte | SNAP", "ヘルプとサポート | SNAP", "帮助与支持 | SNAP"],
        "Help & Support": ["Tulong at Suporta", "Ayuda y soporte", "ヘルプとサポート", "帮助与支持"],
        "About SNAP Workspace": ["Tungkol sa SNAP Workspace", "Acerca de SNAP Workspace", "SNAP Workspaceについて", "关于 SNAP Workspace"],
        "A workspace for productivity, task management, and learning.": ["Workspace para sa pagiging produktibo, pamamahala ng gawain, at pag-aaral.", "Un espacio de productividad, gestión de tareas y aprendizaje.", "生産性、タスク管理、学習のためのワークスペースです。", "用于提高效率、管理任务和学习的工作空间。"],
        "Features": ["Mga Tampok", "Funciones", "機能", "功能"],
        "Organize notes and folders, manage tasks and achievements, and use study chat tools.": ["Ayusin ang mga tala at folder, pamahalaan ang mga gawain at badge, at gamitin ang mga tool sa pag-aaral at chat.", "Organiza notas y carpetas, gestiona tareas y logros, y usa las herramientas de estudio y chat.", "ノートやフォルダーを整理し、タスクや実績を管理して、学習チャットツールを活用できます。", "整理笔记和文件夹、管理任务与成就，并使用学习聊天工具。"],
        "Contact support": ["Makipag-ugnayan sa suporta", "Contactar con soporte", "サポートに問い合わせ", "联系支持"],
        "Frequently asked questions": ["Mga madalas itanong", "Preguntas frecuentes", "よくある質問", "常见问题"],
        "How do I organize my work?": ["Paano ko aayusin ang aking mga gawain?", "¿Cómo organizo mi trabajo?", "作業を整理するには？", "如何整理我的工作？"],
        "Use Notes and Folders to keep study material together, and Tasks to track work.": ["Gamitin ang Mga Tala at Folder para pagsama-samahin ang mga materyal sa pag-aaral, at Mga Gawain para subaybayan ang trabaho.", "Usa Notas y Carpetas para organizar el material de estudio, y Tareas para dar seguimiento al trabajo.", "ノートとフォルダーで学習資料を整理し、タスクで作業を管理します。", "使用笔记和文件夹整理学习资料，并通过任务跟踪工作。"],
        "How do I use SNAP AI and Chat?": ["Paano gamitin ang SNAP AI at Chat?", "¿Cómo uso SNAP AI y Chat?", "SNAP AIとチャットの使い方は？", "如何使用 SNAP AI 和聊天？"],
        "Open AI & Chat from the sidebar to access the study assistant and conversations.": ["Buksan ang AI at Chat sa sidebar para magamit ang study assistant at mga pag-uusap.", "Abre IA y chat en la barra lateral para acceder al asistente de estudio y las conversaciones.", "サイドバーのAI・チャットを開くと、学習アシスタントや会話にアクセスできます。", "从侧边栏打开 AI 与聊天，即可使用学习助手和对话。"],
        "My changes or preferences are not appearing.": ["Hindi lumalabas ang mga pagbabago o kagustuhan ko.", "No aparecen mis cambios o preferencias.", "変更や設定が反映されません。", "我的更改或偏好设置没有显示。"],
        "Check that you are online and signed in. Refresh the page; device-only preferences remain in this browser.": ["Tiyaking online at naka-sign in ka. I-refresh ang pahina; mananatili sa browser na ito ang mga kagustuhan sa device lang.", "Comprueba que tengas conexión y hayas iniciado sesión. Actualiza la página; las preferencias locales permanecen en este navegador.", "オンラインでログインしていることを確認してください。ページを更新してください。端末のみの設定はこのブラウザーに保存されます。", "请确认已联网并登录。刷新页面；仅限设备的偏好设置会保留在此浏览器中。"],
        "A page is not loading correctly.": ["Hindi naglo-load nang tama ang pahina.", "Una página no se carga correctamente.", "ページが正しく読み込まれません。", "页面无法正常加载。"],
        "Try refreshing, check your connection, and sign in again if your session has expired.": ["Subukang i-refresh at tingnan ang koneksyon. Mag-sign in muli kung nag-expire ang session.", "Actualiza la página, comprueba tu conexión e inicia sesión de nuevo si la sesión venció.", "ページを更新して接続を確認してください。セッションが切れている場合は再度ログインしてください。", "请尝试刷新页面并检查网络连接；如果会话已过期，请重新登录。"],
        "Task reminders": ["Mga paalala sa gawain", "Recordatorios de tareas", "タスクのリマインダー", "任务提醒"],
        "Runs while the Tasks page is open and browser notifications are allowed.": ["Gumagana habang bukas ang pahina ng Mga Gawain at pinapayagan ang mga notification ng browser.", "Funciona mientras la página de Tareas está abierta y se permiten las notificaciones del navegador.", "タスクページが開いていて、ブラウザー通知が許可されている間に動作します。", "仅在任务页面打开且允许浏览器通知时运行。"],
        "Task completion updates": ["Mga update sa pagkumpleto ng gawain", "Avisos de tareas completadas", "タスク完了のお知らせ", "任务完成通知"],
        "Preference only; completion notifications are not currently sent.": ["Kagustuhan lamang; hindi pa ipinapadala ang mga notification ng pagkumpleto.", "Solo es una preferencia; actualmente no se envían avisos de finalización.", "設定のみです。現在、完了通知は送信されません。", "仅为偏好设置；目前不会发送完成通知。"],
        "Achievement and badge updates": ["Mga update sa badge at nakamit", "Avisos de logros e insignias", "実績とバッジのお知らせ", "成就与徽章通知"],
        "Preference only; achievement notifications are not currently sent.": ["Kagustuhan lamang; hindi pa ipinapadala ang mga notification ng nakamit.", "Solo es una preferencia; actualmente no se envían avisos de logros.", "設定のみです。現在、実績通知は送信されません。", "仅为偏好设置；目前不会发送成就通知。"],
        "General updates": ["Mga pangkalahatang update", "Avisos generales", "一般のお知らせ", "常规更新"],
        "Preference only; general update notifications are not currently sent.": ["Kagustuhan lamang; hindi pa ipinapadala ang mga pangkalahatang notification.", "Solo es una preferencia; actualmente no se envían avisos generales.", "設定のみです。現在、一般通知は送信されません。", "仅为偏好设置；目前不会发送常规通知。"],
        "Create a task": ["Gumawa ng gawain", "Crear una tarea", "タスクを作成", "创建任务"],
        "Add new task": ["Magdagdag ng bagong gawain", "Añadir una tarea", "新しいタスクを追加", "添加新任务"],
        "Title": ["Pamagat", "Título", "タイトル", "标题"],
        "Category": ["Kategorya", "Categoría", "カテゴリ", "类别"],
        "Due date": ["Takdang petsa", "Fecha de vencimiento", "期限日", "截止日期"],
        "Due time": ["Takdang oras", "Hora de vencimiento", "期限時刻", "截止时间"],
        "Description (optional)": ["Paglalarawan (opsyonal)", "Descripción (opcional)", "説明（任意）", "描述（可选）"],
        "Set reminder": ["Magtakda ng paalala", "Configurar recordatorio", "リマインダーを設定", "设置提醒"],
        "No reminder": ["Walang paalala", "Sin recordatorio", "リマインダーなし", "不提醒"],
        "5 minutes before": ["5 minuto bago", "5 minutos antes", "5分前", "提前 5 分钟"],
        "15 minutes before": ["15 minuto bago", "15 minutos antes", "15分前", "提前 15 分钟"],
        "30 minutes before": ["30 minuto bago", "30 minutos antes", "30分前", "提前 30 分钟"],
        "1 hour before": ["1 oras bago", "1 hora antes", "1時間前", "提前 1 小时"],
        "1 day before": ["1 araw bago", "1 día antes", "1日前", "提前 1 天"],
        "Create": ["Gumawa", "Crear", "作成", "创建"],
        "Edit Task": ["I-edit ang gawain", "Editar tarea", "タスクを編集", "编辑任务"],
        "Save": ["I-save", "Guardar", "保存", "保存"],
        "Cancel": ["Kanselahin", "Cancelar", "キャンセル", "取消"],
        "Send": ["Ipadala", "Enviar", "送信", "发送"],
        "Search": ["Maghanap", "Buscar", "検索", "搜索"],
        "Conversations": ["Mga pag-uusap", "Conversaciones", "会話", "对话"],
        "Direct": ["Direkta", "Directos", "ダイレクト", "私聊"],
        "Groups": ["Mga grupo", "Grupos", "グループ", "群组"],
        "Invitations": ["Mga imbitasyon", "Invitaciones", "招待", "邀请"],
        "Find a SNAP user": ["Maghanap ng SNAP user", "Buscar usuarios de SNAP", "SNAPユーザーを検索", "查找 SNAP 用户"],
        "Create a group": ["Gumawa ng grupo", "Crear un grupo", "グループを作成", "创建群组"],
        "Group name": ["Pangalan ng grupo", "Nombre del grupo", "グループ名", "群组名称"],
        "Message": ["Mensahe", "Mensaje", "メッセージ", "消息"],
        "No notes yet.": ["Wala pang mga tala.", "Aún no hay notas.", "ノートはまだありません。", "还没有笔记。"],
        "New folder": ["Bagong folder", "Nueva carpeta", "新しいフォルダー", "新建文件夹"],
        "All Folders": ["Lahat ng folder", "Todas las carpetas", "すべてのフォルダー", "所有文件夹"],
        "Recently Deleted": ["Kamakailang tinanggal", "Eliminados recientemente", "最近削除した項目", "最近删除"],
        "Empty Trash": ["Alisan ng laman ang basurahan", "Vaciar papelera", "ゴミ箱を空にする", "清空回收站"],
        "Continue": ["Magpatuloy", "Continuar", "続行", "继续"],
        "Undo": ["I-undo", "Deshacer", "元に戻す", "撤销"],
        "Redo": ["Ulitin", "Rehacer", "やり直す", "重做"],
        "Ask SNAP AI": ["Magtanong sa SNAP AI", "Pregunta a SNAP AI", "SNAP AIに質問", "询问 SNAP AI"],
        "Start planning your success today!": ["Simulan nang planuhin ang iyong tagumpay ngayon!", "¡Empieza hoy a planificar tu éxito!", "今日から成功に向けて計画を始めましょう！", "立即开始规划你的成功！"],
        "Already have an account?": ["May account ka na ba?", "¿Ya tienes una cuenta?", "すでにアカウントをお持ちですか？", "已有账户？"],
        "Confirm password": ["Kumpirmahin ang password", "Confirmar contraseña", "パスワードを確認", "确认密码"],
        "First name": ["Pangalan", "Nombre", "名", "名字"],
        "Last name": ["Apelyido", "Apellido", "姓", "姓氏"],
        "Middle name or initial": ["Gitnang pangalan o inisyal", "Segundo nombre o inicial", "ミドルネームまたはイニシャル", "中间名或首字母"],
        "University or college": ["Unibersidad o kolehiyo", "Universidad o instituto", "大学または短期大学", "大学或学院"],
        "Study assistant": ["Katulong sa pag-aaral", "Asistente de estudio", "学習アシスタント", "学习助手"],
        "Task Mode": ["Mode ng Gawain", "Modo de tareas", "タスクモード", "任务模式"],
        "Build a task by chatting with SNAP AI.": ["Gumawa ng gawain sa pakikipag-usap sa SNAP AI.", "Crea una tarea conversando con SNAP AI.", "SNAP AIとのチャットでタスクを作成しましょう。", "通过与 SNAP AI 聊天来创建任务。"],
        "Work with my notes": ["Gamitin ang mga tala ko", "Trabajar con mis notas", "ノートを使う", "使用我的笔记"],
        "Description": ["Paglalarawan", "Descripción", "説明", "描述"],
        "Loading recent conversation...": ["Naglo-load ng kamakailang pag-uusap...", "Cargando la conversación reciente...", "最近の会話を読み込み中...", "正在加载最近的对话..."],
        "Loading messages…": ["Naglo-load ng mga mensahe…", "Cargando mensajes…", "メッセージを読み込み中…", "正在加载消息…"],
        "Loading conversations…": ["Naglo-load ng mga pag-uusap…", "Cargando conversaciones…", "会話を読み込み中…", "正在加载对话…"],
        "+ Group": ["+ Grupo", "+ Grupo", "+ グループ", "+ 群组"],
        "Add members": ["Magdagdag ng mga miyembro", "Añadir miembros", "メンバーを追加", "添加成员"],
        "Invite SNAP users": ["Mag-imbita ng mga SNAP user", "Invitar a usuarios de SNAP", "SNAPユーザーを招待", "邀请 SNAP 用户"],
        "Create group": ["Gumawa ng grupo", "Crear grupo", "グループを作成", "创建群组"],
        "Find SNAP users": ["Maghanap ng mga SNAP user", "Buscar usuarios de SNAP", "SNAPユーザーを検索", "查找 SNAP 用户"],
        "Done": ["Tapos na", "Listo", "完了", "完成"],
        "XP remaining": ["XP na natitira", "XP restantes", "残りXP", "剩余 XP"],
        "Show Less": ["Ipakita nang mas kaunti", "Mostrar menos", "折りたたむ", "收起"],
        "Loading your achievements...": ["Naglo-load ng mga nakamit mo...", "Cargando tus logros...", "実績を読み込み中...", "正在加载你的成就..."],
        "Milestones from the way you learn and organize in SNAP.": ["Mga tagumpay mula sa paraan ng pag-aaral at pag-aayos mo sa SNAP.", "Hitos de cómo aprendes y te organizas en SNAP.", "SNAPでの学習や整理を通じて達成したマイルストーンです。", "记录你在 SNAP 中学习和整理时取得的里程碑。"],
        "Loading achievements...": ["Naglo-load ng mga nakamit...", "Cargando logros...", "実績を読み込み中...", "正在加载成就..."],
        "Locked badge": ["Naka-lock na badge", "Insignia bloqueada", "未獲得のバッジ", "未解锁徽章"],
        "Badge name": ["Pangalan ng badge", "Nombre de la insignia", "バッジ名", "徽章名称"],
        "Loading notes...": ["Naglo-load ng mga tala...", "Cargando notas...", "ノートを読み込み中...", "正在加载笔记..."],
        "Unclassified": ["Hindi nakategorya", "Sin clasificar", "未分類", "未分类"],
        "TRASH": ["BASURAHAN", "PAPELERA", "ゴミ箱", "回收站"],
        "Helpful suggestions for your notes": ["Mga kapaki-pakinabang na mungkahi para sa mga tala mo", "Sugerencias útiles para tus notas", "ノートに役立つ提案", "笔记实用建议"],
        "Delete Account?": ["Tanggalin ang account?", "¿Eliminar la cuenta?", "アカウントを削除しますか？", "删除账户？"],
        "This action cannot be undone. This is a front-end confirmation only.": ["Hindi na maibabalik ang pagkilos na ito. Kumpirmasyon lamang ito sa interface.", "Esta acción no se puede deshacer. Esta es solo una confirmación de la interfaz.", "この操作は取り消せません。これは画面上の確認のみです。", "此操作无法撤销。此处仅为界面确认。"],
        "Delete": ["Tanggalin", "Eliminar", "削除", "删除"],
        "Forgot Password": ["Nakalimutan ang password", "Olvidé mi contraseña", "パスワードを忘れた場合", "忘记密码"],
        "Enter your email or username to reset your password.": ["Ilagay ang email o username mo para i-reset ang password.", "Introduce tu correo o nombre de usuario para restablecer la contraseña.", "パスワードをリセットするには、メールアドレスまたはユーザー名を入力してください。", "输入电子邮件或用户名以重置密码。"],
        "Send Reset Link": ["Ipadala ang link para i-reset", "Enviar enlace de restablecimiento", "リセットリンクを送信", "发送重置链接"],
        "Back to Log In": ["Bumalik sa pag-log in", "Volver a iniciar sesión", "ログインに戻る", "返回登录"],
        "Create Account": ["Gumawa ng account", "Crear cuenta", "アカウントを作成", "创建账户"],
        "Suffix": ["Dagdag na pangalan", "Sufijo", "接尾辞", "后缀"],
        "I agree to the": ["Sumasang-ayon ako sa", "Acepto los", "次に同意します：", "我同意"],
        "Terms & Privacy Policy": ["Mga Tuntunin at Patakaran sa Privacy", "Términos y política de privacidad", "利用規約とプライバシーポリシー", "服务条款和隐私政策"],
        "SNAP User": ["Gumagamit ng SNAP", "Usuario de SNAP", "SNAPユーザー", "SNAP 用户"],
        "University not set": ["Hindi itinakda ang unibersidad", "Universidad no indicada", "大学が設定されていません", "未设置学校"],
        "No email available": ["Walang available na email", "No hay correo disponible", "メールアドレスがありません", "没有可用的电子邮件"],
        "Profile photo": ["Larawan sa profile", "Foto de perfil", "プロフィール写真", "个人资料照片"],
        "Some profile preferences could not be loaded.": ["Hindi ma-load ang ilang kagustuhan sa profile.", "No se pudieron cargar algunas preferencias del perfil.", "一部のプロフィール設定を読み込めませんでした。", "无法加载部分个人资料偏好设置。"],
        "Theme is active on this device, but could not be synced to your account.": ["Aktibo ang tema sa device na ito ngunit hindi na-sync sa account mo.", "El tema está activo en este dispositivo, pero no se pudo sincronizar con tu cuenta.", "テーマはこの端末で有効ですが、アカウントに同期できませんでした。", "主题已在此设备启用，但无法同步到你的账户。"],
        "Unable to load profile progression.": ["Hindi ma-load ang progreso ng profile.", "No se pudo cargar el progreso del perfil.", "プロフィールの進捗を読み込めませんでした。", "无法加载个人资料进度。"],
        "Please enter your first and last name.": ["Ilagay ang pangalan at apelyido mo.", "Introduce tu nombre y apellido.", "名と姓を入力してください。", "请输入名字和姓氏。"],
        "Please shorten the profile fields to fit their limits.": ["Paikliin ang mga detalye sa profile upang umangkop sa mga limitasyon.", "Acorta los campos del perfil para respetar sus límites.", "プロフィール項目を文字数制限内に短くしてください。", "请缩短个人资料字段以符合长度限制。"],
        "Your new password must contain at least 6 characters.": ["Dapat may hindi bababa sa 6 na character ang bagong password.", "La nueva contraseña debe tener al menos 6 caracteres.", "新しいパスワードは6文字以上にしてください。", "新密码至少需要 6 个字符。"],
        "That email address is already being used by another account.": ["Ginagamit na ng ibang account ang email address na iyon.", "Otra cuenta ya usa esa dirección de correo.", "そのメールアドレスは別のアカウントですでに使用されています。", "该电子邮件地址已被其他账户使用。"],
        "Unable to save changes. Please try again.": ["Hindi ma-save ang mga pagbabago. Subukan muli.", "No se pudieron guardar los cambios. Inténtalo de nuevo.", "変更を保存できませんでした。もう一度お試しください。", "无法保存更改，请重试。"],
        "Unable to load your account information.": ["Hindi ma-load ang impormasyon ng account mo.", "No se pudo cargar la información de tu cuenta.", "アカウント情報を読み込めませんでした。", "无法加载你的账户信息。"],
        "Your account information was saved, but your name could not be updated in SNAP user search.": ["Na-save ang impormasyon ng account mo, ngunit hindi na-update ang pangalan sa paghahanap ng SNAP user.", "Se guardó la información de tu cuenta, pero no se pudo actualizar tu nombre en la búsqueda de usuarios de SNAP.", "アカウント情報は保存されましたが、SNAPユーザー検索の名前を更新できませんでした。", "账户信息已保存，但无法更新 SNAP 用户搜索中的姓名。"],
        "Account deletion is not enabled yet. Your account has not been deleted.": ["Hindi pa pinapagana ang pagtanggal ng account. Hindi pa natatanggal ang account mo.", "La eliminación de cuentas aún no está disponible. Tu cuenta no se ha eliminado.", "アカウント削除機能はまだ有効ではありません。アカウントは削除されていません。", "账户删除功能尚未启用，你的账户并未删除。"],
        "Choose a supported language.": ["Pumili ng sinusuportahang wika.", "Elige un idioma compatible.", "対応言語を選択してください。", "请选择受支持的语言。"],
        "The saved language preference could not be loaded.": ["Hindi ma-load ang naka-save na kagustuhan sa wika.", "No se pudo cargar el idioma guardado.", "保存された言語設定を読み込めませんでした。", "无法加载已保存的语言偏好设置。"],
        "Unsaved preference. Notification delivery is limited to the types described on this page.": ["Hindi pa na-save ang kagustuhan. Limitado ang pagpapadala ng notification sa mga uri na inilalarawan sa pahinang ito.", "Preferencia sin guardar. Las notificaciones se limitan a los tipos descritos en esta página.", "未保存の設定です。通知の配信はこのページに記載された種類に限られます。", "偏好设置尚未保存。通知发送范围仅限于本页所述类型。"],
        "Device notification preferences could not be read.": ["Hindi mabasa ang mga kagustuhan sa notification ng device.", "No se pudieron leer las preferencias de notificación del dispositivo.", "端末の通知設定を読み取れませんでした。", "无法读取设备通知偏好设置。"],
        "Showing device preferences; account settings could not be loaded.": ["Ipinapakita ang mga kagustuhan sa device; hindi ma-load ang mga setting ng account.", "Se muestran las preferencias del dispositivo; no se pudo cargar la configuración de la cuenta.", "端末の設定を表示しています。アカウント設定を読み込めませんでした。", "正在显示设备偏好设置；无法加载账户设置。"],
        "Unable to load your notification preferences.": ["Hindi ma-load ang mga kagustuhan sa notification mo.", "No se pudieron cargar tus preferencias de notificación.", "通知設定を読み込めませんでした。", "无法加载你的通知偏好设置。"],
        "Unable to save notification preferences on this device.": ["Hindi ma-save ang mga kagustuhan sa notification sa device na ito.", "No se pudieron guardar las preferencias de notificación en este dispositivo.", "この端末に通知設定を保存できませんでした。", "无法在此设备上保存通知偏好设置。"],
        "Unable to save notification preferences:": ["Hindi ma-save ang mga kagustuhan sa notification:", "No se pudieron guardar las preferencias de notificación:", "通知設定を保存できませんでした：", "无法保存通知偏好设置："],
        "I agree to the Terms & Privacy Policy": ["Sumasang-ayon ako sa Mga Tuntunin at Patakaran sa Privacy", "Acepto los términos y la política de privacidad", "利用規約とプライバシーポリシーに同意します", "我同意服务条款和隐私政策"]
    };

    function stored(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error("Unable to read SNAP preference:", error);
            return null;
        }
    }

    function save(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error("Unable to save SNAP preference:", error);
            window.dispatchEvent(new CustomEvent("snap:preferenceerror", {
                detail: { key: key, error: error }
            }));
        }
    }

    const systemDark = window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    let theme = stored(THEME_KEY) || (systemDark ? "dark" : "light");
    let language = stored(LANGUAGE_KEY) || "en";
    if (theme !== "dark") theme = "light";
    if (!supportedLanguages.includes(language)) language = "en";

    const originalText = new WeakMap();
    const lastText = new WeakMap();
    const originalAttributes = new WeakMap();

    function translateValue(value) {
        const trimmed = value.trim();
        const translations = english[trimmed];
        if (!translations || language === "en") return value;
        const leading = value.match(/^\s*/)[0];
        const trailing = value.match(/\s*$/)[0];
        return leading + translations[supportedLanguages.indexOf(language) - 1] + trailing;
    }

    function translateTree(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (node.parentElement && node.parentElement.closest("[data-no-translate]")) continue;
            if (!originalText.has(node)) originalText.set(node, node.nodeValue);
            else if (node.nodeValue !== lastText.get(node)) originalText.set(node, node.nodeValue);
            const translated = translateValue(originalText.get(node));
            if (node.nodeValue !== translated) node.nodeValue = translated;
            lastText.set(node, translated);
        }

        const elements = root.nodeType === Node.ELEMENT_NODE
            ? [root].concat(Array.from(root.querySelectorAll("*")))
            : Array.from(root.querySelectorAll("*"));
        elements.forEach(element => {
            ["placeholder", "title", "aria-label"].forEach(attribute => {
                if (!element.hasAttribute(attribute)) return;
                let values = originalAttributes.get(element);
                if (!values) {
                    values = {};
                    originalAttributes.set(element, values);
                }
                if (!(attribute in values)) values[attribute] = element.getAttribute(attribute);
                element.setAttribute(attribute, translateValue(values[attribute]));
            });
        });
        document.documentElement.lang = language;
        const title = document.querySelector("title");
        if (title) {
            if (!originalAttributes.has(title)) originalAttributes.set(title, {});
            const values = originalAttributes.get(title);
            if (!("text" in values)) values.text = title.textContent;
            const translatedTitle = translateValue(values.text);
            if (title.textContent !== translatedTitle) title.textContent = translatedTitle;
        }
    }

    function setTheme(value, persist) {
        theme = value === "dark" ? "dark" : "light";
        document.documentElement.dataset.theme = theme;
        if (persist !== false) save(THEME_KEY, theme);
        const button = document.querySelector(".toggle");
        if (button) {
            button.setAttribute("aria-pressed", String(theme === "dark"));
            button.setAttribute("aria-checked", String(theme === "dark"));
        }
        window.dispatchEvent(new CustomEvent("snap:themechange", {
            detail: { theme: theme }
        }));
    }

    function setLanguage(value, persist) {
        if (!supportedLanguages.includes(value)) {
            throw new RangeError("Unsupported SNAP language: " + value);
        }
        language = value;
        if (persist !== false) save(LANGUAGE_KEY, language);
        translateTree(document.documentElement);
        window.dispatchEvent(new CustomEvent("snap:languagechange", {
            detail: { language: language }
        }));
    }

    window.snapPreferences = {
        getTheme: function () { return theme; },
        getLanguage: function () { return language; },
        setTheme: setTheme,
        setLanguage: setLanguage,
        translate: function (text) { return translateValue(text); }
    };

    setTheme(theme, false);
    setLanguage(language, false);

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
                else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
                    translateTree(node.parentElement);
                }
            });
            if (mutation.type === "characterData" && mutation.target.parentElement) {
                translateTree(mutation.target.parentElement);
            }
        });
    });
    observer.observe(document.documentElement, {
        childList: true,
        characterData: true,
        subtree: true
    });

    window.addEventListener("storage", function (event) {
        if (event.key === THEME_KEY && event.newValue) setTheme(event.newValue, false);
        if (event.key === LANGUAGE_KEY && event.newValue) setLanguage(event.newValue, false);
    });

    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (event) {
            if (!stored(THEME_KEY)) setTheme(event.matches ? "dark" : "light", false);
        });
    }

    document.addEventListener("click", function (event) {
        const toggle = event.target.closest(".toggle");
        if (toggle) setTheme(theme === "dark" ? "light" : "dark");
    });

}());
