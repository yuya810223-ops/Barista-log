// app.js - バリスタ支援ツール UIコントローラー

// 初期デモデータ
const DEMO_RECORDS = [
    {
        id: "demo-1",
        date: "2026-06-12 10:30",
        beanName: "エチオピア イルガチェフェ (浅煎り)",
        dose: 18.0,
        grindSize: 4.5,
        yield: 38.0,
        time: 20,
        temp: 93,
        acidity: 5,
        bitterness: 1,
        body: 2,
        sweetness: 2,
        balance: 2,
        notes: ["sour_sharp"],
        comment: "初回の抽出。流れが非常に早く、かなり刺すような酸味。コクがなく薄い印象。",
        analysis: {
            primaryIssue: "アンダー抽出（抽出不足）",
            statusTags: ["アンダー抽出", "お湯の通りが速い", "ルンゴ傾向 (薄い/雑味)"],
            brewRatio: 2.11,
            flowRate: 1.9,
            analysisText: "酸味がシャープで刺すように強く、甘みやコク（ボディ）が十分に引き出されていません。抽出倍率（2.1倍）または抽出時間（20秒、速度 1.9g/s）が短すぎるか、粉が粗すぎてお湯とコーヒー粉の接触時間が足りていない可能性があります。",
            suggestions: [
                "グラインダーの挽き目を少し細かくして、お湯の流速を遅く（目標 1.2〜1.4 g/s）してください。",
                "抽出時間を少し長め（26〜30秒）に設定し、甘みとコクを引き出します。",
                "もし可能なら、お湯の温度を1〜2°C上げることで、抽出効率を高めることができます。"
            ],
            nextSettings: {
                dose: 18.0,
                grindSize: 4.2,
                yield: 36.0,
                time: "27-29",
                temp: 94
            }
        }
    },
    {
        id: "demo-2",
        date: "2026-06-12 14:15",
        beanName: "エチオピア イルガチェフェ (浅煎り)",
        dose: 18.0,
        grindSize: 3.5,
        yield: 36.0,
        time: 34,
        temp: 94,
        acidity: 2,
        bitterness: 4,
        body: 4,
        sweetness: 3,
        balance: 3,
        notes: ["bitter_burnt", "astringent"],
        comment: "挽き目をかなり細かくしたところ、流れが遅くなりすぎて後半に焦げたような苦味と渋みが出てしまった。",
        analysis: {
            primaryIssue: "オーバー抽出（過剰抽出）",
            statusTags: ["オーバー抽出", "詰まり気味 / 流れが遅い"],
            brewRatio: 2.0,
            flowRate: 1.06,
            analysisText: "苦味が強く、後味にトゲトゲしさや焦げたような雑味、また口がすぼまるような渋み（アストリンゼンシー）が残っています。挽き目が細かすぎるためにお湯が通りにくくなり（抽出速度 1.1g/s）、コーヒーのネガティブな成分まで溶け出してしまっている状態です。",
            suggestions: [
                "グラインダーの挽き目を少し粗くして、抽出の詰まりを解消してください。",
                "抽出量を少し減らす（例：36gから34gにする）か、抽出時間を短縮（目標23〜26秒）して、後半の渋みの流出を防ぎます。",
                "お湯の温度を1°C下げることで、焦げたような苦味や渋みの抽出を抑えられます。"
            ],
            nextSettings: {
                dose: 18.0,
                grindSize: 3.8,
                yield: 36.0,
                time: "24-26",
                temp: 93
            }
        }
    },
    {
        id: "demo-3",
        date: "2026-06-13 09:00",
        beanName: "エチオピア イルガチェフェ (浅煎り)",
        dose: 18.0,
        grindSize: 3.8,
        yield: 36.0,
        time: 27,
        temp: 93,
        acidity: 3,
        bitterness: 3,
        body: 4,
        sweetness: 4,
        balance: 5,
        notes: [],
        comment: "甘みが引き立ち、酸味もオレンジのようにフルーティーで丸みがある。非常にバランスが良い！",
        analysis: {
            primaryIssue: "素晴らしい抽出バランス！",
            statusTags: ["グッドショット", "適正抽出"],
            brewRatio: 2.0,
            flowRate: 1.33,
            analysisText: "酸味、苦味、甘み、およびボディが非常に美しいバランスで調和しています。抽出速度（1.3g/s）も抽出倍率（2.0倍）も理想的です。この豆のポテンシャルがしっかり引き出されています。",
            suggestions: [
                "現在の抽出設定は非常に優れています。このレシピをベースライン（基準）として保存しましょう。",
                "今後は、タンピングの圧力や粉のディストリビューションを一貫して同じに保ち、再現性を高めることに注力してください。"
            ],
            nextSettings: {
                dose: 18.0,
                grindSize: 3.8,
                yield: 36.0,
                time: "26-28",
                temp: 93
            }
        }
    }
];

class BaristaApp {
    constructor() {
        this.records = [];
        this.currentAnalysis = null;
        this.chart = null;

        this.init();
    }

    init() {
        // LocalStorageからデータをロード
        const savedData = localStorage.getItem("barista_records");
        if (savedData) {
            try {
                this.records = JSON.parse(savedData);
            } catch (e) {
                console.error("データの読み込みに失敗しました。デモデータを使用します。", e);
                this.records = [...DEMO_RECORDS];
            }
        } else {
            // データが空なら初期デモデータを格納
            this.records = [...DEMO_RECORDS];
            this.saveRecords();
        }

        // 豆リストのロード
        this.loadBeans();

        // AI設定のロード
        this.loadAISettings();

        // イベントリスナーの登録
        this.registerEvents();

        // UIの初期描画
        this.renderHistory();
        this.renderCharts();
        
        // フォームに初期の標準的な値をセット
        this.resetForm();

        // 最新のレコードの分析結果を初期表示
        if (this.records.length > 0) {
            this.currentAnalysis = this.records[0].analysis;
            this.showAnalysisResult(this.records[0]);
        }
    }

    loadBeans() {
        const defaultBeans = [
            "エチオピア イルガチェフェ (浅煎り)",
            "ブラジル サントス (中煎り)",
            "ケニアAA (深煎り)",
            "グアテマラ ウェイウェイテナンゴ (中深煎り)"
        ];
        this.beans = JSON.parse(localStorage.getItem("barista_beans"));
        if (!this.beans || this.beans.length === 0) {
            this.beans = defaultBeans;
            this.saveBeans();
        }
        this.renderBeansDropdown();
    }

    saveBeans() {
        localStorage.setItem("barista_beans", JSON.stringify(this.beans));
    }

    renderBeansDropdown() {
        const select = document.getElementById("bean-select");
        if (!select) return;
        
        // 最初のオプションを残してクリア
        select.innerHTML = '<option value="">-- 登録済みの豆を選択 --</option>';
        this.beans.forEach(bean => {
            const opt = document.createElement("option");
            opt.value = bean;
            opt.innerText = bean;
            select.appendChild(opt);
        });
    }

    addBeanIfNew(beanName) {
        if (!beanName) return;
        if (!this.beans.includes(beanName)) {
            this.beans.push(beanName);
            this.saveBeans();
            this.renderBeansDropdown();
        }
    }

    loadAISettings() {
        const engine = localStorage.getItem("barista_ai_engine") || "local";
        const apiKey = localStorage.getItem("barista_api_key") || "";
        const style = localStorage.getItem("barista_coach_style") || "gentle";
        const burr = localStorage.getItem("barista_burr_type") || "mizen";

        document.getElementById("ai-engine").value = engine;
        document.getElementById("api-key").value = apiKey;
        document.getElementById("coach-style").value = style;
        document.getElementById("burr-type").value = burr;

        this.toggleAPIKeyField(engine);
    }

    saveAISettings() {
        const engine = document.getElementById("ai-engine").value;
        const apiKey = document.getElementById("api-key").value;
        const style = document.getElementById("coach-style").value;
        const burr = document.getElementById("burr-type").value;

        localStorage.setItem("barista_ai_engine", engine);
        localStorage.setItem("barista_api_key", apiKey);
        localStorage.setItem("barista_coach_style", style);
        localStorage.setItem("barista_burr_type", burr);
    }

    toggleAPIKeyField(engine) {
        const container = document.getElementById("api-key-container");
        if (engine === "gemini") {
            container.classList.remove("hidden");
        } else {
            container.classList.add("hidden");
        }
    }

    registerEvents() {
        // AI設定の変更監視
        const engineSelect = document.getElementById("ai-engine");
        if (engineSelect) {
            engineSelect.addEventListener("change", (e) => {
                this.toggleAPIKeyField(e.target.value);
                this.saveAISettings();
            });
        }
        
        const apiKeyInput = document.getElementById("api-key");
        if (apiKeyInput) {
            apiKeyInput.addEventListener("change", () => {
                this.saveAISettings();
            });
        }

        const coachStyleSelect = document.getElementById("coach-style");
        if (coachStyleSelect) {
            coachStyleSelect.addEventListener("change", () => {
                this.saveAISettings();
                // 設定変更時に最新レコードを現在のキャラクターで再解析
                if (this.records.length > 0 && document.getElementById("ai-engine").value === "local") {
                    const latest = this.records[0];
                    const inputData = {
                        dose: latest.dose,
                        grindSize: latest.grindSize,
                        grinderSpeed: latest.grinderSpeed || 5,
                        yield: latest.yield,
                        time: latest.time,
                        temp: latest.temp,
                        preinfusionOn: latest.preinfusionOn || 2.0,
                        preinfusionWait: latest.preinfusionWait || 3.0,
                        acidity: latest.acidity,
                        bitterness: latest.bitterness,
                        body: latest.body,
                        sweetness: latest.sweetness,
                        balance: latest.balance,
                        notes: latest.notes,
                        comment: latest.comment
                    };
                    latest.analysis = BaristaAI.analyze(inputData, coachStyleSelect.value);
                    this.records[0] = latest;
                    this.saveRecords();
                    this.showAnalysisResult(latest);
                }
            });
        }

        const burrTypeSelect = document.getElementById("burr-type");
        if (burrTypeSelect) {
            burrTypeSelect.addEventListener("change", () => {
                this.saveAISettings();
            });
        }

        // ログ記録のみボタン
        const logOnlyBtn = document.getElementById("log-only-btn");
        if (logOnlyBtn) {
            logOnlyBtn.addEventListener("click", () => {
                this.handleLogOnlySubmit();
            });
        }

        // 抽出フォーム送信 (AI解析)
        const form = document.getElementById("brew-form");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleBrewSubmit();
            });
        }

        // リセットボタン
        const resetBtn = document.getElementById("reset-btn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                this.resetForm();
            });
        }

        // サジェスト適用ボタン
        const applyBtn = document.getElementById("apply-suggest-btn");
        if (applyBtn) {
            applyBtn.addEventListener("click", () => {
                this.applySuggestionsToForm();
            });
        }

        // 履歴クリアボタン
        const clearHistoryBtn = document.getElementById("clear-history-btn");
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener("click", () => {
                if (confirm("これまでの抽出履歴をすべて消去しますか？（デモデータにリセットされます）")) {
                    this.records = [...DEMO_RECORDS];
                    this.saveRecords();
                    this.renderHistory();
                    this.renderCharts();
                    this.showToast("履歴を初期化しました");
                }
            });
        }

        // 豆選択のプルダウン切り替え
        const beanSelect = document.getElementById("bean-select");
        if (beanSelect) {
            beanSelect.addEventListener("change", (e) => {
                if (e.target.value) {
                    document.getElementById("bean-name").value = e.target.value;
                }
            });
        }

        // 豆削除ボタン
        const deleteBeanBtn = document.getElementById("delete-bean-btn");
        if (deleteBeanBtn) {
            deleteBeanBtn.addEventListener("click", () => {
                const select = document.getElementById("bean-select");
                const selectedBean = select.value;
                if (!selectedBean) {
                    alert("削除する豆をプルダウンから選択してください。");
                    return;
                }
                if (confirm(`豆「${selectedBean}」をリストから削除しますか？`)) {
                    this.beans = this.beans.filter(b => b !== selectedBean);
                    this.saveBeans();
                    this.renderBeansDropdown();
                    document.getElementById("bean-name").value = "";
                    this.showToast("コーヒー豆をリストから削除しました");
                }
            });
        }

        // イベント委譲で削除ボタンを監視
        document.getElementById("history-list").addEventListener("click", (e) => {
            if (e.target.closest(".delete-record-btn")) {
                const id = e.target.closest(".delete-record-btn").dataset.id;
                this.deleteRecord(id);
            }
            if (e.target.closest(".edit-record-btn")) {
                const id = e.target.closest(".edit-record-btn").dataset.id;
                this.editRecord(id);
            }
        });
    }

    saveRecords() {
        localStorage.setItem("barista_records", JSON.stringify(this.records));
    }

    deleteRecord(id) {
        if (!confirm("この抽出ログを削除しますか？")) return;

        this.records = this.records.filter(rec => rec.id !== id);
        this.saveRecords();
        this.renderHistory();
        this.renderCharts();
        this.showToast("抽出ログを削除しました");
        // もし削除したレコードが表示中の分析結果だったら非表示にする
        if (this.currentAnalysis && this.currentAnalysis.id === id) {
            document.getElementById("analysis-result-section").classList.add("hidden");
        }
    }

    editRecord(id) {
        const recordToEdit = this.records.find(rec => rec.id === id);
        if (!recordToEdit) {
            this.showToast("編集するレコードが見つかりません");
            return;
        }

        // フォームにデータをロード
        document.getElementById("bean-name").value = recordToEdit.beanName;
        document.getElementById("dose").value = recordToEdit.dose;
        document.getElementById("grind-size").value = recordToEdit.grindSize;
        document.getElementById("grinder-speed").value = recordToEdit.grinderSpeed || 5;
        document.getElementById("yield").value = recordToEdit.yield;
        document.getElementById("time").value = recordToEdit.time;
        document.getElementById("temp").value = recordToEdit.temp;
        document.getElementById("preinfusion-on").value = recordToEdit.preinfusionOn || 2.0;
        document.getElementById("preinfusion-wait").value = recordToEdit.preinfusionWait || 3.0;

        document.getElementById("acidity").value = recordToEdit.acidity;
        document.getElementById("bitterness").value = recordToEdit.bitterness;
        document.getElementById("body").value = recordToEdit.body;
        document.getElementById("sweetness").value = recordToEdit.sweetness;
        document.getElementById("crema").value = recordToEdit.crema !== undefined ? recordToEdit.crema : 3;
        document.getElementById("balance").value = recordToEdit.balance;
        this.updateSliderLabels();

        const checkboxes = document.querySelectorAll("input[name='notes']");
        checkboxes.forEach(cb => {
            cb.checked = recordToEdit.notes.includes(cb.value);
        });
        document.getElementById("comment").value = recordToEdit.comment;

        // フォームを編集モードにするための隠しフィールドやボタンの切り替え（今回はシンプルにそのまま上書き保存とする）
        this.showToast("フォームにデータをロードしました。編集後、再度『解析を依頼』または『ログを記録』してください。");

        // フォームへスクロール
        document.getElementById("brew-form").scrollIntoView({ behavior: "smooth" });

        // 編集対象のレコードを削除（上書き保存を前提）
        this.records = this.records.filter(rec => rec.id !== id);
        this.saveRecords();
        this.renderHistory();
        this.renderCharts();
    }

    resetForm() {
        document.getElementById("bean-name").value = "エチオピア イルガチェフェ (浅煎り)";
        document.getElementById("bean-select").value = "エチオピア イルガチェフェ (浅煎り)";
        document.getElementById("dose").value = "18.0";
        document.getElementById("grind-size").value = "2.1"; // Lagom P64のエスプレッソ挽き目は通常1.5〜3.0付近
        document.getElementById("grinder-speed").value = "5"; // 5ダイアル (800 RPM)
        document.getElementById("yield").value = "36.0";
        document.getElementById("time").value = "26";
        document.getElementById("temp").value = "93";

        document.getElementById("preinfusion-on").value = "2.0";
        document.getElementById("preinfusion-wait").value = "3.0";

        // スライダー/ラジオ
        document.getElementById("acidity").value = "3";
        document.getElementById("bitterness").value = "3";
        document.getElementById("body").value = "3";
        document.getElementById("sweetness").value = "3";
        document.getElementById("crema").value = "3";
        document.getElementById("balance").value = "3";

        // スライダーの値表示の更新
        this.updateSliderLabels();

        // チェックボックス解除
        const checkboxes = document.querySelectorAll("input[name='notes']");
        checkboxes.forEach(cb => cb.checked = false);

        document.getElementById("comment").value = "";

        // 分析エリアを非表示
        document.getElementById("analysis-result-section").classList.add("hidden");
    }

    updateSliderLabels() {
        const sliders = ["acidity", "bitterness", "body", "sweetness", "crema", "balance"];
        sliders.forEach(id => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(`${id}-val`);
            if (el && valEl) {
                valEl.innerText = el.value;
                el.oninput = function() {
                    valEl.innerText = this.value;
                }
            }
        });
    }

    async handleBrewSubmit() {
        // フォームから値を取得
        const beanName = document.getElementById("bean-name").value.trim() || "ブレンド";
        const dose = parseFloat(document.getElementById("dose").value);
        const grindSize = parseFloat(document.getElementById("grind-size").value);
        const grinderSpeed = parseInt(document.getElementById("grinder-speed").value);
        const yieldVal = parseFloat(document.getElementById("yield").value);
        const time = parseInt(document.getElementById("time").value);
        const temp = parseInt(document.getElementById("temp").value);

        const preinfusionOn = parseFloat(document.getElementById("preinfusion-on").value);
        const preinfusionWait = parseFloat(document.getElementById("preinfusion-wait").value);

        const acidity = parseInt(document.getElementById("acidity").value);
        const bitterness = parseInt(document.getElementById("bitterness").value);
        const body = parseInt(document.getElementById("body").value);
        const sweetness = parseInt(document.getElementById("sweetness").value);
        const crema = parseInt(document.getElementById("crema").value);
        const balance = parseInt(document.getElementById("balance").value);

        const comment = document.getElementById("comment").value.trim();

        // 選択されたノート
        const notes = [];
        document.querySelectorAll('input[name="notes"]:checked').forEach(cb => {
            notes.push(cb.value);
        });

        // 入力検証
        if (isNaN(dose) || isNaN(grindSize) || isNaN(grinderSpeed) || isNaN(yieldVal) || isNaN(time) || isNaN(preinfusionOn) || isNaN(preinfusionWait)) {
            alert("抽出パラメータを正しく入力してください。");
            return;
        }

        this.addBeanIfNew(beanName);

        const inputData = {
            dose, grindSize, grinderSpeed, yield: yieldVal, time, temp,
            preinfusionOn, preinfusionWait,
            acidity, bitterness, body, sweetness, crema, balance, notes, comment
        };

        const engine = document.getElementById("ai-engine").value;
        const apiKey = document.getElementById("api-key").value.trim();
        const coachStyle = document.getElementById("coach-style").value;

        // API選択時にキーが無い場合は警告してローカルに切り替え
        if (engine === "gemini" && !apiKey) {
            alert("Gemini APIキーが設定されていません。上部の「AIコーチ設定」を開いてキーを入力するか、ローカルAIを選択してください。今回はローカルAIで実行します。");
            document.getElementById("ai-engine").value = "local";
            this.toggleAPIKeyField("local");
            this.saveAISettings();
        }

        const activeEngine = document.getElementById("ai-engine").value;

        // 送信ボタンのローディング表示
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Geminiが抽出データを深く思考中...
        `;

        let analysis;
        let apiSuccess = false;

        if (activeEngine === "gemini" && apiKey) {
            try {
                analysis = await this.fetchExternalAI(activeEngine, apiKey, coachStyle, inputData);
                apiSuccess = true;
            } catch (err) {
                console.error("Gemini APIでの通信中にエラーが発生しました。ローカルAIに自動切り替えします。", err);
                this.showToast("APIエラーのためローカルAIが代働します！");
            }
        }

        // フォールバック または ローカル設定
        if (!apiSuccess) {
            analysis = BaristaAI.analyze(inputData, coachStyle);
        }

        // 新しいレコードオブジェクト
        const now = new Date();
        const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const newRecord = {
            id: "rec-" + Date.now(),
            date: dateString,
            beanName,
            dose,
            grindSize,
            yield: yieldVal,
            time,
            temp,
            acidity,
            bitterness,
            body,
            sweetness,
            crema,
            balance,
            notes,
            comment,
            analysis
        };

        // 履歴に追加 & 保存
        this.records.unshift(newRecord); // 最新を先頭に
        this.saveRecords();

        // 結果を画面に表示
        this.currentAnalysis = analysis;
        this.showAnalysisResult(newRecord);

        // UIを更新
        this.renderHistory();
        this.renderCharts();

        // ボタンの復元
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;

        if (apiSuccess) {
            this.showToast("世界一のバリスタAIから極秘アドバイスが届きました！");
        } else {
            this.showToast("抽出レシピを記録し、AIが分析しました！");
        }

        // 分析エリアへスクロール
        document.getElementById("analysis-result-section").scrollIntoView({ behavior: 'smooth' });
    }

    async handleLogOnlySubmit() {
        // フォームから値を取得
        const beanName = document.getElementById("bean-name").value.trim() || "ブレンド";
        const dose = parseFloat(document.getElementById("dose").value);
        const grindSize = parseFloat(document.getElementById("grind-size").value);
        const grinderSpeed = parseInt(document.getElementById("grinder-speed").value);
        const yieldVal = parseFloat(document.getElementById("yield").value);
        const time = parseInt(document.getElementById("time").value);
        const temp = parseInt(document.getElementById("temp").value);

        const preinfusionOn = parseFloat(document.getElementById("preinfusion-on").value);
        const preinfusionWait = parseFloat(document.getElementById("preinfusion-wait").value);

        const acidity = parseInt(document.getElementById("acidity").value);
        const bitterness = parseInt(document.getElementById("bitterness").value);
        const body = parseInt(document.getElementById("body").value);
        const sweetness = parseInt(document.getElementById("sweetness").value);
        const crema = parseInt(document.getElementById("crema").value);
        const balance = parseInt(document.getElementById("balance").value);

        const comment = document.getElementById("comment").value.trim();

        // 選択されたノート
        const notes = [];
        document.querySelectorAll('input[name="notes"]:checked').forEach(cb => {
            notes.push(cb.value);
        });

        // 入力検証
        if (isNaN(dose) || isNaN(grindSize) || isNaN(grinderSpeed) || isNaN(yieldVal) || isNaN(time) || isNaN(preinfusionOn) || isNaN(preinfusionWait)) {
            alert("抽出パラメータを正しく入力してください。");
            return;
        }

        this.addBeanIfNew(beanName);

        const brewRatio = yieldAmount => yieldVal / dose;

        // 解析を一切行わず、純粋な記録を生成
        const now = new Date();
        const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const newRecord = {
            id: "rec-" + Date.now(),
            date: dateString,
            beanName,
            dose,
            grindSize,
            grinderSpeed,
            yield: yieldVal,
            time,
            temp,
            preinfusionOn,
            preinfusionWait,
            acidity,
            bitterness,
            body,
            sweetness,
            crema,
            balance,
            notes,
            comment,
            analysis: {
                primaryIssue: "未分析ログ（データ記録のみ）",
                statusTags: ["手動記録"],
                brewRatio: parseFloat((yieldVal / dose).toFixed(2)),
                flowRate: parseFloat((yieldVal / time).toFixed(2)),
                analysisText: "このログはAIによる分析を実行していません。データとして保存されました。",
                suggestions: ["次回、分析を行うには『世界一のバリスタAIに解析を依頼』ボタンから送信してください。"],
                nextSettings: {
                    dose: dose,
                    grindSize: grindSize,
                    grinderSpeed: grinderSpeed,
                    yield: yieldVal,
                    time: time,
                    temp: temp,
                    preinfusionOn: preinfusionOn,
                    preinfusionWait: preinfusionWait
                }
            }
        };

        // 履歴に追加 & 保存
        this.records.unshift(newRecord);
        this.saveRecords();

        // UIを更新
        this.renderHistory();
        this.renderCharts();

        this.showToast("抽出ログのみを履歴に記録しました");
    }

    async fetchExternalAI(engine, apiKey, coachStyle, inputData) {
        let styleName = "情熱と優しさを持つ世界チャンピオン";
        if (coachStyle === "scientific") styleName = "精密なデータ分析を得意とするコーヒー科学者";
        if (coachStyle === "traditional") styleName = "イタリア伝統カフェの厳しいが愛のある老舗マスター";
        const burrType = document.getElementById("burr-type").value;
        
        let burrName = "Mizen 64mm Omni (バランス型)";
        if (burrType === "ssp_mp") burrName = "SSP Multipurpose (超解像クリーン、低微粉、高速流速)";
        if (burrType === "ssp_hu") burrName = "SSP High Uniformity (高濃度、高微粉、クラシックな重厚ボディ)";
        if (burrType === "ssp_cast") burrName = "SSP Cast Sweet (甘み・複雑な質感・滑らかさ重視)";

        const systemPrompt = `あなたは世界一のエスプレッソバリスタチャンピオンであり、ユーザーの専属コーチです。キャラクター性格設定（${styleName}）に完璧に成りきってアドバイスしてください。
ユーザーのエスプレッソ抽出結果を定量的指標（抽出比率、流速）や味わいのデータから徹底分析し、型通りの回答（挽き目を細かく/粗くする）を超えた、プロならではのクリエイティブな「アイデア・改善アプローチ」を出してください。

使用機材:
- エスプレッソマシン: La Marzocco Linea Micra (プレインフュージョンはお湯を入れる時間ONと待機時間WAITの設定があります)
- グラインダー: Option-O Lagom P64 (搭載刃: ${burrName}。挽目 0-10段階、回転スピード 1-9段階。1-9スピードは200 RPMから1400 RPMに換算可能。数式: RPM = 200 + (Speed - 1) * 150)

分析の際は、このLinea Micra特有のプレインフュージョン制御(ON/WAIT)や、Lagom P64の回転スピード設定および搭載されている刃(${burrName})の物理特性（粒度分布の均一さ、微粉量、流速の違い）が味わいやチャネリングに与える影響にまで深く踏み込み、プロとして極めて精度の高い具体的な数値・改善アイディアを提示してください。

必ず以下のJSONフォーマットのみを返却してください。マークダウンブロックや余計な解説の文字は含めず、純粋なJSON文字列のみを出力してください：
{
  "primaryIssue": "抽出課題のタイトル (例: プレインフュージョンによる微チャネリングの解消)",
  "statusTags": ["タグ1", "タグ2", "タグ3"],
  "analysisText": "ここに世界一のバリスタとしての熱意ある分析、解説、プロならではのクリエイティブな改善アドバイス、アイデアを記述してください（日本語、300文字〜500文字程度。指定のキャラクター性を最大限に活かし、Linea MicraやLagom P64および搭載刃の特性を想定したプロの視点を入れること）。",
  "suggestions": [
    "プロならではのアクション提案1 (例: WDTのほぐし方や、プレインフュージョン時間の変更、エイジング等)",
    "プロならではのアクション提案2",
    "プロならではのアクション提案3"
  ],
  "nextSettings": {
    "dose": 豆の量 (数値、例: 18.0),
    "grindSize": 挽き目ダイアル (数値、0.0〜10.0、例: 2.1),
    "grinderSpeed": グラインダースピード (数値、1〜9、例: 4),
    "grinderRPM": 換算RPM (数値、200〜1400、例: 650),
    "yield": 抽出量 (数値、例: 36.0),
    "time": "抽出時間 (文字列、例: '26-29')",
    "temp": 湯温 (数値、例: 93),
    "preinfusionOn": プレインフュージョン水ON秒数 (数値、0.0〜10.0、例: 2.5),
    "preinfusionWait": プレインフュージョン待機秒数 (数値、0.0〜10.0、例: 4.0)
  }
}`;

        const userPrompt = `ユーザーの抽出データ:
- コーヒー豆: ${inputData.beanName}
- 粉の量: ${inputData.dose}g
- 挽き目ダイアル(Lagom P64): ${inputData.grindSize} (スピード: ${inputData.grinderSpeed} / ${200 + (inputData.grinderSpeed - 1) * 150} RPM, 刃の種類: ${burrName})
- Linea Micra設定: 湯温 ${inputData.temp}°C, Pre-Inf ON ${inputData.preinfusionOn}秒, WAIT ${inputData.preinfusionWait}秒
- 抽出量: ${inputData.yield}g
- 抽出時間: ${inputData.time}秒
- 定量計算値: 比率 1 : ${(inputData.yield / inputData.dose).toFixed(2)}, 流速 ${(inputData.yield / inputData.time).toFixed(2)} g/s
- 味わい評価: 酸味 ${inputData.acidity}/5, 苦味 ${inputData.bitterness}/5, コク ${inputData.body}/5, 甘み ${inputData.sweetness}/5, 総合バランス ${inputData.balance}/5
- 異常検知タグ: ${inputData.notes.join(", ") || "なし"}
- ユーザーメモ: "${inputData.comment || "なし"}"`;

        let rawResponse = "";

        if (engine === "gemini") {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nユーザーの入力データ:\n${userPrompt}`
                        }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.7
                    }
                })
            });
            if (!res.ok) throw new Error("Gemini API returned status " + res.status);
            const resData = await res.json();
            rawResponse = resData.candidates[0].content.parts[0].text;
        }

        // JSONをパースして返す
        try {
            const parsed = JSON.parse(rawResponse.trim());
            
            // 必要なデータ形式の確認
            return {
                brewRatio: parseFloat((inputData.yield / inputData.dose).toFixed(2)),
                flowRate: parseFloat((inputData.yield / inputData.time).toFixed(2)),
                primaryIssue: parsed.primaryIssue || "世界チャンピオンAIの分析",
                statusTags: parsed.statusTags || ["AIアドバイス"],
                analysisText: parsed.analysisText || "分析データがありません。",
                suggestions: parsed.suggestions || [],
                nextSettings: parsed.nextSettings || {
                    dose: inputData.dose,
                    grindSize: inputData.grindSize,
                    yield: inputData.yield,
                    time: "24-28",
                    temp: inputData.temp
                }
            };
        } catch (parseErr) {
            console.error("AI応答のパースに失敗しました。生の応答: ", rawResponse);
            throw parseErr;
        }
    }

    showAnalysisResult(record) {
        const section = document.getElementById("analysis-result-section");
        section.classList.remove("hidden");

        const ana = record.analysis;

        // 見出し・ステータス
        document.getElementById("res-title").innerText = ana.primaryIssue;
        
        // タグの描画
        const tagsContainer = document.getElementById("res-tags");
        tagsContainer.innerHTML = "";
        ana.statusTags.forEach(tag => {
            const span = document.createElement("span");
            span.className = "px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200 shadow-sm";
            span.innerText = tag;
            tagsContainer.appendChild(span);
        });

        // 抽出データ要約
        document.getElementById("res-ratio").innerHTML = `比率: <span class="font-bold text-amber-900">1 : ${ana.brewRatio}</span>`;
        document.getElementById("res-flow").innerHTML = `流速: <span class="font-bold text-amber-900">${ana.flowRate} g/s</span>`;

        // --- 抽出科学インジケータ (TDS/EY/Risk) のレンダリング更新 ---
        const tds = ana.estimatedTDS || 9.5;
        const ey = ana.estimatedEY || 19.5;
        const risk = ana.channelingRisk || 15;

        // TDS
        document.getElementById("tds-val-display").innerText = `${tds.toFixed(2)}%`;
        const tdsStatusEl = document.getElementById("tds-status");
        if (tds < 8.0) {
            tdsStatusEl.innerText = "過小(薄い)";
            tdsStatusEl.className = "text-[10px] font-bold text-blue-800 bg-blue-100/50 px-1.5 py-0.5 rounded";
        } else if (tds > 12.0) {
            tdsStatusEl.innerText = "過多(濃い)";
            tdsStatusEl.className = "text-[10px] font-bold text-red-800 bg-red-100/50 px-1.5 py-0.5 rounded";
        } else {
            tdsStatusEl.innerText = "適正レンジ";
            tdsStatusEl.className = "text-[10px] font-bold text-amber-800 bg-amber-100/50 px-1.5 py-0.5 rounded";
        }
        document.getElementById("tds-bar").style.width = `${Math.min(Math.max((tds - 5) * 10, 5), 100)}%`;

        // EY
        document.getElementById("ey-val-display").innerText = `${ey.toFixed(2)}%`;
        const eyStatusEl = document.getElementById("ey-status");
        if (ey < 18.0) {
            eyStatusEl.innerText = "アンダー抽出";
            eyStatusEl.className = "text-[10px] font-bold text-blue-800 bg-blue-100/50 px-1.5 py-0.5 rounded";
        } else if (ey > 22.0) {
            eyStatusEl.innerText = "オーバー抽出";
            eyStatusEl.className = "text-[10px] font-bold text-red-800 bg-red-100/50 px-1.5 py-0.5 rounded";
        } else {
            eyStatusEl.innerText = "最適(Sweet Spot)";
            eyStatusEl.className = "text-[10px] font-bold text-emerald-800 bg-emerald-100/50 px-1.5 py-0.5 rounded";
        }
        document.getElementById("ey-bar").style.width = `${Math.min(Math.max((ey - 10) * 6.25, 5), 100)}%`;

        // Channeling Risk
        document.getElementById("risk-val-display").innerText = `${risk}%`;
        const riskStatusEl = document.getElementById("risk-status");
        const riskBarEl = document.getElementById("risk-bar");
        if (risk < 20) {
            riskStatusEl.innerText = "極めて安全";
            riskStatusEl.className = "text-[10px] font-bold text-emerald-800 bg-emerald-100/50 px-1.5 py-0.5 rounded";
            riskBarEl.className = "bg-emerald-500 h-full rounded-full transition-all";
        } else if (risk > 60) {
            riskStatusEl.innerText = "チャネリング警戒";
            riskStatusEl.className = "text-[10px] font-bold text-red-800 bg-red-100/50 px-1.5 py-0.5 rounded";
            riskBarEl.className = "bg-red-500 h-full rounded-full transition-all";
        } else {
            riskStatusEl.innerText = "通常リスク";
            riskStatusEl.className = "text-[10px] font-bold text-amber-800 bg-amber-100/50 px-1.5 py-0.5 rounded";
            riskBarEl.className = "bg-amber-500 h-full rounded-full transition-all";
        }
        document.getElementById("risk-bar").style.width = `${risk}%`;

        // 分析テキスト
        document.getElementById("res-description").innerText = ana.analysisText;

        // 改善アクション
        const actionList = document.getElementById("res-actions");
        actionList.innerHTML = "";
        ana.suggestions.forEach(suggest => {
            const li = document.createElement("li");
            li.className = "flex items-start gap-2 bg-white p-3 rounded-lg border border-amber-100 shadow-sm";
            li.innerHTML = `
                <svg class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-gray-700 text-sm font-medium">${suggest}</span>
            `;
            actionList.appendChild(li);
        });

        // 次回提案設定
        document.getElementById("next-dose").innerText = `${ana.nextSettings.dose} g`;
        // 挽目と回転数をセットで表示
        const rpm = ana.nextSettings.grinderRPM || (200 + (ana.nextSettings.grinderSpeed - 1) * 150);
        document.getElementById("next-grind").innerHTML = `${ana.nextSettings.grindSize}<br><span class="text-[10px] text-amber-200/80">Spd ${ana.nextSettings.grinderSpeed} (${rpm} RPM)</span>`;
        document.getElementById("next-yield").innerText = `${ana.nextSettings.yield} g`;
        document.getElementById("next-time").innerText = `${ana.nextSettings.time} 秒`;
        // 湯温とプレインフュージョン
        document.getElementById("next-temp").innerHTML = `${ana.nextSettings.temp} °C<br><span class="text-[10px] text-amber-200/80">Pre-Inf: ${ana.nextSettings.preinfusionOn}s - ${ana.nextSettings.preinfusionWait}s</span>`;
    }

    applySuggestionsToForm() {
        if (!this.currentAnalysis) return;

        const next = this.currentAnalysis.nextSettings;
        document.getElementById("dose").value = next.dose;
        document.getElementById("grind-size").value = next.grindSize;
        if (next.grinderSpeed) {
            document.getElementById("grinder-speed").value = next.grinderSpeed;
        }
        document.getElementById("yield").value = next.yield;
        
        // タイムは「24-26秒」のような文字列なので数値化して中央値をセット
        if (typeof next.time === "string") {
            const parts = next.time.split("-");
            if (parts.length === 2) {
                const avg = Math.round((parseInt(parts[0]) + parseInt(parts[1])) / 2);
                document.getElementById("time").value = avg;
            } else {
                document.getElementById("time").value = parseInt(next.time) || "26";
            }
        } else {
            document.getElementById("time").value = next.time;
        }

        document.getElementById("temp").value = next.temp;
        if (next.preinfusionOn !== undefined) {
            document.getElementById("preinfusion-on").value = next.preinfusionOn;
        }
        if (next.preinfusionWait !== undefined) {
            document.getElementById("preinfusion-wait").value = next.preinfusionWait;
        }

        // スライダーの値を中央（3）に戻す
        const sliders = ["acidity", "bitterness", "body", "sweetness", "balance"];
        sliders.forEach(id => {
            document.getElementById(id).value = "3";
        });
        this.updateSliderLabels();

        // コメント、ノートをリセット
        document.getElementById("comment").value = "";
        const checkboxes = document.querySelectorAll('input[name="notes"]');
        checkboxes.forEach(cb => cb.checked = false);

        // トースト通知
        this.showToast("次回の推奨設定をフォームに適用しました！");
        
        // フォームへスクロール
        document.getElementById("brew-form").scrollIntoView({ behavior: 'smooth' });
    }

    renderHistory() {
        const container = document.getElementById("history-list");
        if (!container) return;

        if (this.records.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-gray-400">抽出履歴がありません</div>`;
            return;
        }

        container.innerHTML = "";
        this.records.forEach(rec => {
            const item = document.createElement("div");
            item.className = "bg-amber-50/40 p-4 rounded-xl border border-amber-900/10 hover:border-amber-600/30 transition-all flex flex-col md:flex-row justify-between gap-4 relative";
            
            // 左側：基本情報、味わいパラメータ
            let notesHtml = rec.notes.map(note => {
                const mapping = {
                    "sour_sharp": "刺すような酸味",
                    "bitter_burnt": "焦げた苦味",
                    "astringent": "後味の渋み",
                    "channeling": "チャネリング",
                    "flat_watery": "水っぽい"
                };
                return `<span class="bg-red-50 text-red-700 text-2xs px-2 py-0.5 rounded border border-red-200">${mapping[note] || note}</span>`;
            }).join(" ");

            const speed = rec.grinderSpeed || 5;
            const rpm = 200 + (speed - 1) * 150;
            const preOn = rec.preinfusionOn !== undefined ? rec.preinfusionOn : "2.0";
            const preWait = rec.preinfusionWait !== undefined ? rec.preinfusionWait : "3.0";

            item.innerHTML = `
                <div class="flex-1 space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-medium">${rec.date}</span>
                        <h4 class="text-sm font-bold text-gray-800">${rec.beanName}</h4>
                        <span class="text-xs text-amber-900 font-bold bg-amber-200/50 px-2.5 py-0.5 rounded border border-amber-900/10 shadow-sm">${rec.analysis ? rec.analysis.primaryIssue : "未分析"}</span>
                    </div>

                    <!-- 抽出パラメータ -->
                    <div class="grid grid-cols-5 gap-1 bg-white p-2 rounded-lg border border-amber-900/5 text-center text-xs text-gray-600 shadow-inner">
                        <div>
                            <div class="text-2xs text-gray-400">豆の量</div>
                            <div class="font-bold text-gray-800">${rec.dose}g</div>
                        </div>
                        <div>
                            <div class="text-2xs text-gray-400">挽き目(P64)</div>
                            <div class="font-bold text-gray-800">${rec.grindSize} <span class="text-[10px] text-amber-800 font-medium">(S:${speed})</span></div>
                        </div>
                        <div>
                            <div class="text-2xs text-gray-400">抽出量</div>
                            <div class="font-bold text-gray-800">${rec.yield}g</div>
                        </div>
                        <div>
                            <div class="text-2xs text-gray-400">時間</div>
                            <div class="font-bold text-gray-800">${rec.time}秒</div>
                        </div>
                        <div>
                            <div class="text-2xs text-gray-400">Micra設定</div>
                            <div class="font-bold text-gray-800">${rec.temp}°C <span class="text-[9px] text-amber-800 block">(${preOn}s-${preWait}s)</span></div>
                        </div>
                    </div>

                    <!-- コメント・メモ -->
                    ${rec.comment ? `<p class="text-xs text-gray-600 bg-amber-100/10 p-2 rounded border-l-2 border-amber-500 italic">「${rec.comment}」</p>` : ""}
                    ${notesHtml ? `<div class="flex flex-wrap gap-1 mt-1">${notesHtml}</div>` : ""}
                </div>

                <!-- 右側：味わいスコアメーター -->
                <div class="flex flex-col justify-center items-center gap-1 bg-white/70 p-3 rounded-xl border border-amber-100 min-w-[140px] shadow-sm">
                    <div class="text-2xs text-amber-800 font-bold">味わい評価</div>
                    <div class="text-xs text-gray-600 w-full space-y-1">
                        <div class="flex justify-between items-center">
                            <span>酸味</span>
                            <span class="font-semibold text-amber-900">${"★".repeat(rec.acidity)}${"☆".repeat(5-rec.acidity)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>苦味</span>
                            <span class="font-semibold text-amber-900">${"★".repeat(rec.bitterness)}${"☆".repeat(5-rec.bitterness)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>甘み</span>
                            <span class="font-semibold text-amber-900">${"★".repeat(rec.sweetness)}${"☆".repeat(5-rec.sweetness)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>クレマ</span>
                            <span class="font-semibold text-amber-900">${"★".repeat(rec.crema !== undefined ? rec.crema : 3)}${"☆".repeat(5-(rec.crema !== undefined ? rec.crema : 3))}</span>
                        </div>
                        <div class="flex justify-between items-center bg-amber-100/50 px-1 rounded font-bold">
                            <span>バランス</span>
                            <span class="text-amber-800">${rec.balance}/5</span>
                        </div>
                    </div>
                </div>

                <!-- Edit/Delete Buttons -->
                <div class="absolute top-2 right-2 flex gap-1">
                    <button class="edit-record-btn text-amber-700 hover:text-amber-900 p-1 rounded-full hover:bg-amber-100 transition-colors" data-id="${rec.id}" title="編集">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7-6l-4 4L19 18l4-4-4-4z"></path></svg>
                    </button>
                    <button class="delete-record-btn text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors" data-id="${rec.id}" title="削除">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
            container.appendChild(item);
        });

        // Append event listeners for edit/delete buttons after rendering history
        this.addHistoryButtonListeners();
    }

    addHistoryButtonListeners() {
        document.querySelectorAll(".edit-record-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                this.editRecord(id);
            });
        });

        document.querySelectorAll(".delete-record-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteRecord(id);
            });
        });
    }

    renderCharts() {
        const ctx = document.getElementById("trend-chart");
        if (!ctx) return;

        // すでにチャートがある場合は破棄して再描画
        if (this.chart) {
            this.chart.destroy();
        }

        // 直近10件を古い順にして描画
        const recentData = [...this.records].slice(0, 10).reverse();
        if (recentData.length === 0) {
            return;
        }

        const labels = recentData.map((rec, idx) => `#${idx + 1} (${rec.date.split(" ")[0].slice(5)})`);
        const balanceScores = recentData.map(rec => rec.balance);
        const sweetnessScores = recentData.map(rec => rec.sweetness);
        const acidityScores = recentData.map(rec => rec.acidity);
        const bitternessScores = recentData.map(rec => rec.bitterness);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '総合バランス',
                        data: balanceScores,
                        borderColor: '#b45309', // amber-700
                        backgroundColor: '#b4530922',
                        borderWidth: 3,
                        pointBackgroundColor: '#b45309',
                        pointRadius: 4,
                        tension: 0.15
                    },
                    {
                        label: '甘み',
                        data: sweetnessScores,
                        borderColor: '#10b981', // emerald-500
                        borderWidth: 1.5,
                        pointRadius: 2,
                        tension: 0.1
                    },
                    {
                        label: '酸味',
                        data: acidityScores,
                        borderColor: '#3b82f6', // blue-500
                        borderWidth: 1,
                        borderDash: [3, 3],
                        pointRadius: 2,
                        tension: 0.1
                    },
                    {
                        label: '苦味',
                        data: bitternessScores,
                        borderColor: '#ef4444', // red-500
                        borderWidth: 1,
                        borderDash: [3, 3],
                        pointRadius: 2,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: '#00000008'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });
    }

    showToast(message) {
        let toast = document.getElementById("toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-amber-900 text-amber-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all duration-300 transform translate-y-10 opacity-0 z-50 flex items-center gap-2";
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <svg class="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${message}
        `;

        // フェードイン
        setTimeout(() => {
            toast.classList.remove("translate-y-10", "opacity-0");
        }, 10);

        // フェードアウト
        setTimeout(() => {
            toast.classList.add("translate-y-10", "opacity-0");
        }, 3000);
    }
}

// ドキュメント読み込み完了時にインスタンス化
document.addEventListener("DOMContentLoaded", () => {
    window.app = new BaristaApp();
});
