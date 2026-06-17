/**
 * バリスタAI分析エンジン (Barista AI Analysis Engine)
 * 
 * エスプレッソの抽出パラメータと味わい評価から、
 * 現在の抽出状態（アンダー、オーバー、チャネリングなど）を分析し、
 * 次回に向けた具体的な改善アクションと推奨設定を提案します。
 * 
 * 筐体仕様:
 * - エスプレッソマシン: La Marzocco Linea Micra (インフュージョンON/待機時間設定)
 * - グラインダー: Option-O Lagom P64 (挽目ダイアル 0-10, スピードダイアル 1-9 [200-1400 RPM])
 */

class BaristaAI {
    /**
     * 回転数インデックス(1-9)を実際のRPMに換算する
     * @param {number} speed 
     * @returns {number} RPM (200 - 1400)
     */
    static convertToRPM(speed) {
        return 200 + (speed - 1) * 150;
    }

    /**
     * 抽出結果を分析し、評価・改善提案を生成する (ローカルフォールバック用)
     * @param {Object} data 
     * @param {string} coachStyle - コーチのキャラクター性格設定
     * @returns {Object} 分析結果オブジェクト
     */
    static analyze(data, coachStyle = "gentle") {
        const dose = parseFloat(data.dose); // 豆の量 (g)
        const grindSize = parseFloat(data.grindSize); // グラインダー挽き目 (0-10)
        const grinderSpeed = parseInt(data.grinderSpeed) || 5; // グラインダー回転スピード (1-9)
        const yieldAmount = parseFloat(data.yield); // 抽出量 (g)
        const time = parseFloat(data.time); // 抽出時間 (秒)
        const temp = data.temp ? parseFloat(data.temp) : 93; // お湯の温度 (°C)

        // Linea Micra プレインフュージョン
        const preinfusionOn = data.preinfusionOn ? parseFloat(data.preinfusionOn) : 2.0; // インフュージョン秒
        const preinfusionWait = data.preinfusionWait ? parseFloat(data.preinfusionWait) : 3.0; // 待機秒

        // 味わい評価 (1-5段階)
        const acidity = parseInt(data.acidity); // 酸味
        const bitterness = parseInt(data.bitterness); // 苦味
        const body = parseInt(data.body); // ボディ/コク
        const sweetness = parseInt(data.sweetness); // 甘み
        const balance = parseInt(data.balance); // バランス
        const crema = data.crema ? parseInt(data.crema) : 3; // クレマ
        const notes = data.notes || []; // 特徴タグ
        const userComment = data.comment || ""; // ユーザーのコメント

        // --- 1. 定量的指標の計算 ---
        const brewRatio = yieldAmount / dose; // 抽出倍率
        const flowRate = yieldAmount / time; // 抽出速度 (g/s)
        const currentRPM = this.convertToRPM(grinderSpeed);

        let statusTags = [];
        let primaryIssue = "";
        let analysisText = "";
        let suggestions = [];
        
        let nextSettings = {
            dose: dose,
            grindSize: grindSize,
            grinderSpeed: grinderSpeed,
            grinderRPM: currentRPM,
            yield: yieldAmount,
            time: "24-30",
            temp: temp,
            preinfusionOn: preinfusionOn,
            preinfusionWait: preinfusionWait
        };

        // --- 2. 抽出状態の判定ロジック ---
        let isUnderExtracted = false;
        let isOverExtracted = false;
        let isChanneling = false;
        let isGood = false;

        const isFastFlow = flowRate > 1.8;
        const isSlowFlow = flowRate < 0.9;

        if (notes.includes("channeling") || (acidity >= 4 && bitterness >= 4 && flowRate > 1.7)) {
            isChanneling = true;
        }

        if (!isChanneling) {
            if ((acidity >= 4 && bitterness <= 2) || (isFastFlow && acidity >= 3.5 && bitterness <= 3) || notes.includes("sour_sharp")) {
                isUnderExtracted = true;
            } else if ((bitterness >= 4 && acidity <= 2) || (isSlowFlow && bitterness >= 3.5 && acidity <= 3) || notes.includes("bitter_burnt") || notes.includes("astringent")) {
                isOverExtracted = true;
            } else if (balance >= 4 && sweetness >= 3.5 && acidity >= 2.5 && acidity <= 3.5 && bitterness >= 2.5 && bitterness <= 3.5) {
                isGood = true;
            }
        }

        // --- 3. コーチのパーソナリティに応じたテキスト生成 ---
        const personas = {
            gentle: {
                title: "世界チャンピオン・専属コーチ (情熱と優しさ)",
                channeling: `やあ！Linea MicraとLagom P64という素晴らしい機材でのエスプレッソ抽出、素晴らしい情熱ですね。
流速が ${flowRate.toFixed(1)}g/s と早く、酸味と苦味が混ざっているようです。これはお湯が偏って流れる「チャネリング」が起きています。
Lagom P64の回転スピードは現在 ${grinderSpeed} (${currentRPM} RPM) ですね。非常に高性能なグラインダーですから、挽き目ダイアルだけでなく、回転数とプレインフュージョンを少し調整することで、お湯の通り道を抜群に均一に整えることができますよ！`,
                channelingSuggests: [
                    "WDTツールを使い、バスケットの外周付近（フィルターの縁）までダマを優しく、完全にほぐして平らにしましょう。",
                    `Linea Micraのプレインフュージョンを【水ON: 2.5秒 / 待機: 4.0秒】に伸ばしてみましょう。低圧でじっくり粉全体に水を行き渡らせることで、9気圧の本抽出時にお湯が均一に通るようになり、チャネリングを劇的に防げます！`,
                    `Lagom P64の回転数を少し下げてスピード 3〜4 (${this.convertToRPM(3)}〜${this.convertToRPM(4)} RPM) にしてみてください。回転数を抑えることで粒度の揃いがよりクリーンになり、チャネリングの原因となる極小の微粉溜まりができにくくなります。`
                ],
                under: `こんにちは！Lagom P64の極めてクリーンな粉で、Linea Micraから美しく伸びるエスプレッソを狙った素晴らしい一杯ですね。
味わいとして、少し鋭い酸味が目立ってしまったようです。これは「アンダー抽出」の状態。クリーンな分、甘みが引き出される手前で終わってしまっています。この極上のマシン達なら、あと少しの微調整でシルクのような甘いコーヒーに仕上げられますよ！`,
                underSuggests: [
                    `Lagom P64の挽き目ダイアルを 0.2〜0.3メモリ締めて細かく調整しましょう。お湯の通過を遅らせて接触時間を伸ばします。`,
                    `Linea Micraのインフュージョン時間を【水ON: 3.0秒 / 待機: 3.5秒】に設定してみてください。加圧前の蒸らし（浸漬）を長く取ることで、浅煎りの硬い豆でも糖類がしっかりと熱水に溶け出しやすくなり、刺すような酸味が丸い甘みに変化します！`,
                    `Lagom P64の回転スピードを 7 (${this.convertToRPM(7)} RPM) に上げてみてください。あえて回転数を上げることで適度に微粉（Fines）を発生させ、ボディ感を豊かにし、抽出効率（甘みの溶出）を向上させられます。`
                ],
                over: `エスプレッソに対する素晴らしいこだわり、素晴らしいですね！
今回は、後味に焦げたような苦味や渋みが残ってしまったようです（流速 ${flowRate.toFixed(1)}g/s、抽出詰まり気味）。
Lagom P64の高性能なフラットバーは非常にフレーバーがクリアな反面、お湯が詰まると苦味が強調されやすいです。Linea Micraの高い熱安定性を活かして、後半の重たい雑味だけをエレガントにカットしましょう！`,
                overSuggests: [
                    `Lagom P64の挽き目ダイアルを 0.2〜0.3メモリ荒く開いて、お湯の通り道をスムーズに（目標 1.2〜1.4g/s）しましょう。`,
                    `Linea Micraのプレインフュージョンの水ONを【1.5秒】、待機を【2.0秒】と少し短縮、または一旦プレインフュージョン無し（お湯ON 0秒）にしてみてください。お湯と粉の過剰な接触を抑えることで、苦渋みの流出をピタッと防げます。`,
                    `Lagom P64の回転スピードを 2〜3 (${this.convertToRPM(2)}〜${this.convertToRPM(3)} RPM) へ下げてみてください。微粉の発生を最小限に抑え、フラット刃ならではの極めてクリーンで雑味のない、スッキリとした味わいになります。`
                ],
                good: `素晴らしい！震えるほど見事なショットです！
Linea Micraのプレインフュージョン、そしてLagom P64のグラインド特性（${currentRPM} RPM）が、この豆のポテンシャルと完璧にシンクロしました。
酸味、苦味、甘みの調和、そしてLagomならではの解像度の高いフレーバーが、Lineaの強固な圧力で美しく押し出されています。チャンピオンシップレベルの一杯です！`,
                goodSuggests: [
                    `今日の素晴らしいレシピ（挽き目 ${grindSize}、回転数 ${grinderSpeed}、Pre-Inf ON:${preinfusionOn}s/WAIT:${preinfusionWait}s）を『黄金レシピ』として完全に記録しましょう！`,
                    "Linea Micraのパドル操作のタイミング（シャワーの予熱フラッシング）を一貫して同じに保ち、抽出再現性を高めることにフォーカスしましょう。",
                    "豆の焙煎から日数が経ち（エイジング）、ガスが抜けてきたら、挽き目を0.1細かくするか、回転数を1段階上げてフレーバーの厚みを補填してみてください。"
                ],
                neutral: `抽出お疲れ様です！素晴らしい機材達の力をしっかり引き出せていますね。
極端な失敗はなく、十分に美味しいエスプレッソです。ですが、Linea MicraとLagom P64のポテンシャルはこんなものではありません！
あと数ミリのプロファイリング調整で、異次元のジューシーさや極上の甘みへとステップアップできますよ。`,
                neutralSuggests: [
                    acidity > bitterness 
                      ? `少し酸味寄りですね。Lagomの挽き目を0.1細かくするか、あるいはLinea MicraのPre-Inf WAIT（待機時間）を0.5秒伸ばして、甘みをもう一絞り引き出しましょう。`
                      : `少し苦味が勝っています。Lagomの挽き目を0.1荒くするか、あるいは回転スピードを1段階下げて、雑味のないすっきりした甘みを追求してみましょう。`,
                    "Linea Micraは家庭用最高峰のグループヘッド熱安定性を持っています。湯温1°Cの上下が味に直結しますので、浅煎りのフルーティーさを出すなら94°C、深煎りのチョコ感を出すなら91°Cへの微調整を試してください。"
                ]
            },
            scientific: {
                title: "データ科学バリスタ (精密分析)",
                channeling: `【物理要因解析: Linea Micra圧力不均一（チャネリング）】
Lagom P64（${currentRPM} RPM）のシャープな粒度分布下において、流速 ${flowRate.toFixed(1)}g/s と高値を示す不均一高圧流。
Linea Micraの強力なロータリーポンプが送り出す9barの初期水圧が、乾燥状態のコーヒーベッドの一部を決壊させ、水路（チャネル）を形成しています。`,
                channelingSuggests: [
                    `Linea Micraの初期加圧による衝撃を和らげるため、プレインフュージョン設定を【水ON: 2.5秒 / 待機: 4.5秒】に設定。水路形成前にコーヒーベッドを完全飽和（膨張）させてクラックを自己修復させます。`,
                    `Lagom P64のグラインドRPMを 4 (${this.convertToRPM(4)} RPM) に変更。フラット刃の静電気・局所摩擦を軽減し、バスケット内での極小微粉の局所的な偏積を防ぎます。`,
                    "バスケット内の粉の密度勾配を排他するため、WDTによる放射状撹拌、およびプッシュプレッシャーが水平であることを再検証してください。"
                ],
                under: `【熱化学要因解析: 糖類析出不足（アンダー抽出）】
流速 ${flowRate.toFixed(1)}g/s、比率 1 : ${brewRatio.toFixed(2)}。接触時間が短く、Lagom P64の均一な粒度分布から、高分子の親油性・親水性中間成分（糖類やカラメル等）の EY (抽出収率) が不足。
Linea Micraの高熱容量を最大限利用し、熱水接触時間の延長とプレインフュージョンによるプレソーク効率の最大化を図る必要があります。`,
                underSuggests: [
                    `Lagom P64のダイアルを 0.2メモリ細かく締めて幾何学的表面積を増大、流出への水力抵抗を強化。`,
                    `Linea Micraのプレインフュージョンを【水ON: 3.0秒 / 待機: 3.5秒】に延伸。予備浸漬フェーズを長くとることで熱化学的な可溶成分の細胞壁からの脱着速度を増大させます。`,
                    `Lagom P64の回転数を 6〜7 (${this.convertToRPM(6)}〜${this.convertToRPM(7)} RPM) へ昇速。粒径分布の微粉フラクションを微増させ、抽出速度のコントロールとボディ感の向上を狙います。`
                ],
                over: `【熱化学要因解析: 終期雑味の過剰流出（オーバー抽出）】
流速 ${flowRate.toFixed(1)}g/s と極低速。お湯がコーヒー粉ベッド内を低流速で移動した結果、可溶性上限を超え、不快なフェノール化合物や焦げ様炭化苦味が過剰析出（EY過多）。
Lagom P64の均質性を活かし、通過ボイド率を確保しつつ過度な加圧時間を遮断します。`,
                overSuggests: [
                    `Lagom P64のダイアルを 0.3メモリ荒く設定。ボイド比（粒子間隙）を拡大させ流動抵抗を低下させます。`,
                    `Linea Micraのプレインフュージョン設定を【水ON: 1.5秒 / 待機: 2.0秒】に減少、または【無効】に設定。初期飽和を抑制することで、酸味・脂質主体の上流相抽出のみに留めます。`,
                    `Lagom P64のグラインドスピードを 2 (${this.convertToRPM(2)} RPM) に降速。粒度分布のバイモーダル（二峰性）の広がりを抑制し、過剰抽出の原因である微粉（Fines）を極限まで低減します。`
                ],
                good: `【システム均衡検知: 理想熱力学バランス】
Linea Micraの強力な温度安定性とLagom P64の精密粒度（${currentRPM} RPM）の完璧な相互作用。
抽出比率 1 : ${brewRatio.toFixed(2)}、流速 ${flowRate.toFixed(1)}g/s は、可溶固形分（TDS）比率およびフレーバーの解像度において最適平衡点（Sweet Spot）に到達しています。`,
                goodSuggests: [
                    `このパラメータ（GrindSize: ${grindSize}、RPM: ${currentRPM}、Pre-Inf ON:${preinfusionOn}s/WAIT:${preinfusionWait}s）を最高プロファイルとしてローカル保存。`,
                    "Linea Micraの抽出用お湯（硬度 50〜90 ppm、適度なマグネシウム・カルシウム比率）の水質を固定し、化学反応の再現性を維持してください。",
                    "エイジング進行に伴うコーヒー粉の内圧（CO2含有量）低下に追従するため、4〜5日後に挽き目を0.05〜0.1微調整するプロファイル変動に備えてください。"
                ],
                neutral: `【システム分析: 微細プロファイリング調整フェーズ】
定常状態は良好ですが、Lagom P64とLinea Micraというハイエンドシステムの実力から算出すると、味わいのスペクトル（フレーバーの広がり）をさらに拡大可能。
熱接触キネティクスと粒度分布特性の微調整を行います。`,
                neutralSuggests: [
                    acidity > bitterness 
                      ? `酸味優勢。Linea Micraの待機（WAIT）を0.5秒追加して蒸らしを強めるか、Lagomの挽き目を0.1微細化。`
                      : `苦味優位。Lagom P64のスピードを1段階降速させ微粉を排除、またはLinea Micraの抽出温度（Temp）を92°Cに降温。`,
                    "Linea Micraのシャワースクリーン背後の流路均一性を保つため、バックフラッシュ清掃（ケミカル洗浄）の周期を一定に保ってください。"
                ]
            },
            traditional: {
                title: "イタリア伝統店マスター (経験と感覚)",
                channeling: `ふん、Linea MicraにLagom P64か！
とびきり極上の道具を使っておきながら、お湯を暴れさせてどうする！
流速 ${flowRate.toFixed(1)}g/s はお湯が粉を突き破って逃げておる。これではマシーンが泣いているぞ。
P64のスピード（${grinderSpeed}、${currentRPM} RPM）とお前のLineaの蒸らしが、まだコーヒーと噛み合っていない。もっと粉をじっくり手なずけるのだ。`,
                channelingSuggests: [
                    "WDTを使うときは、バスケットの底をこするだけでなく、全体を優しく円を描くように美しくほぐし、ベッドを完全に平らにするのだ。道具に頼るだけでなく、お前の手先に魂を込めろ！",
                    `Linea Micraのインフュージョンを【水ON: 2.5秒 / 待機: 4.0秒】と長めに取るのだ。本気で圧力をかける前に、熱いお湯を粉全体にじっくり染み込ませて団結させれば、お湯は逃げ道を失い、まっすぐ綺麗に降りてくる。`,
                    `Lagom P64の回転スピードを 3か4 (${this.convertToRPM(3)}〜${this.convertToRPM(4)} RPM) に落としてみろ。グラインダーをあまり急がせるな。ゆっくり挽くことで粉の粒が美しく揃い、お湯の通りが均一になる。`
                ],
                under: `おいおい、これはただお湯を右から左へ流しただけの、すっぱいジュースだな。
Linea Micraの気品ある抽出も、Lagom P64の澄んだ挽き目も、これでは宝の持ち腐れだ。
流速が ${flowRate.toFixed(1)}g/s では早すぎる！もっと豆の奥深くにある、ハチミツのような甘みと芳醇なアロマを絞り出さねばエスプレッソとは呼べんぞ。`,
                underSuggests: [
                    `Lagom P64のダイアルを 0.3目盛りほど締めて細かくしろ。粉の抵抗でお湯の流速を抑えるのだ。`,
                    `Linea Micraのパドルを入れ、お湯を【3.0秒】入れてから【3.5秒】待つプレインフュージョンを試せ。硬い浅煎り豆でも、これで完全に蒸らされ、驚くほどの豊かなコクと甘みが飛び出してくる。`,
                    `Lagom P64の回転スピードを 7 (${this.convertToRPM(7)} RPM) に少し上げてみろ。少しだけ粉に複雑さを持たせ、エスプレッソらしいとろりとしたボディ（粘性）を強く引き出すのだ。`
                ],
                over: `ううむ、エスプレッソが焦げ臭いツラをしておる。
粉が細かすぎてLinea Micraがお湯を通せず、苦しんで窒息した状態だな。流速 ${flowRate.toFixed(1)}g/s ではお湯が粉に捕まりすぎだ。
Lagomのフラット刃は優秀だが、お湯を通しすぎると一気に渋みや焦げが出やすい。もっと気持ちよくお湯を走らせてやらんか！`,
                overSuggests: [
                    `Lagom P64のダイアルを 0.3メモリ荒く開け。粉の間に、お湯がすっと通る呼吸の余地を作れ。`,
                    `Linea Micraのプレインフュージョンを【水ON: 1.5秒 / 待機: 2.0秒】に縮めるか、いっそ切ってしまえ。長すぎる蒸らしは、深煎り豆や細かすぎる粉の雑味を引き出す引き金になるのだ。`,
                    `Lagom P64の回転スピードを 2〜3 (${this.convertToRPM(2)}〜${this.convertToRPM(3)} RPM) へ落とせ。極限まで微粉を減らし、フラット刃本来の、澄み切った雑味のない高貴なコクだけをカップに注ぎ込むのだ。`
                ],
                good: `これだ！これぞ天上のエスプレッソ、まさに神の雫だ！
Lagom P64の澄んだグラインド（${currentRPM} RPM）と、Linea Micraの鉄壁の抽出が完璧な結婚を果たしたな。
口に入れた瞬間のベルベットのようなトロみ、そして鼻に抜ける圧倒的な甘い香り。この素晴らしい機材達を手なずけ、豆の魂をすべて引き出したお前の感覚に、心から拍手を送ろう！`,
                goodSuggests: [
                    `今日のレシピ（挽き目 ${grindSize}、回転数スピード ${grinderSpeed}、Pre-Inf ON:${preinfusionOn}s/WAIT:${preinfusionWait}s）は一滴の無駄もない。忘れないように胸に刻み込め！`,
                    "Linea Micraのポルタフィルターをグループヘッドに差し込む前に、ヘッドの周りを必ず綺麗にフラッシングして温めておけ。細かな一貫性こそがプロの命だ。",
                    "豆の個性を試すなら、お湯の温度を1°C変えてみろ。93°Cから94°Cにするだけで、華やかなベリーのような香りが一気に開くぞ。"
                ],
                neutral: `悪くはない。Linea MicraとLagom P64という名馬を乗りこなすだけの腕はあるな。
だが、このマシーン達はもっと素晴らしい世界を我々に見せてくれるはずだ。
お前のその手先と五感でもう一歩、極上の領域へ踏み込んでみよう。`,
                neutralSuggests: [
                    acidity > bitterness 
                      ? `やや酸味が鋭いな。Lagomの挽き目を0.1細かくするか、あるいはLineaのPre-Inf WAIT（待機時間）を0.5秒伸ばして、甘みとの調和を補うのだ。`
                      : `やや苦味が重たい。Lagomの回転スピードを1段階下げて微粉を減らすか、Lineaの湯温を1°C下げて、高貴なクリーンさを際立たせるのだ。`,
                    "ポルタフィルターは常にマシーンに装着してアツアツに予熱しておけ。金属が少しでも冷めていると、エスプレッソの豊かなアロマが台無しになるぞ。"
                ]
            }
        };

        const currentPersona = personas[coachStyle] || personas.gentle;

        if (isChanneling) {
            primaryIssue = "チャネリング（偏流・抽出ムラ）の検出";
            statusTags.push("チャネリング疑い", "抽出不均一");
            analysisText = currentPersona.channeling;
            suggestions = currentPersona.channelingSuggests;
            nextSettings.grindSize = Math.round((grindSize + 0.2) * 10) / 10;
            // チャネリング時は pre-infusion を少し長めにして均一化を計る
            nextSettings.preinfusionOn = 2.5;
            nextSettings.preinfusionWait = 4.0;
            // 回転数は少し下げて微粉を減らす
            if (grinderSpeed > 3) nextSettings.grinderSpeed = grinderSpeed - 1;
            nextSettings.time = "26-28";
        } 
        else if (isUnderExtracted) {
            primaryIssue = "アンダー抽出（可溶成分の抽出不足）";
            statusTags.push("アンダー抽出", "高流速 / 接触不足");
            analysisText = currentPersona.under;
            suggestions = currentPersona.underSuggests;
            nextSettings.grindSize = Math.round((grindSize - 0.2) * 10) / 10;
            // 抽出不足時はプレインフュージョンを伸ばしてお湯を馴染ませる
            nextSettings.preinfusionOn = 3.0;
            nextSettings.preinfusionWait = 3.5;
            // 回転数を少し上げて抽出効率アップ
            if (grinderSpeed < 7) nextSettings.grinderSpeed = grinderSpeed + 1;
            nextSettings.time = "27-29";
            if (temp < 95) nextSettings.temp = temp + 1;
        } 
        else if (isOverExtracted) {
            primaryIssue = "オーバー抽出（雑味・渋みの過剰流出）";
            statusTags.push("オーバー抽出", "低流速 / 詰まり傾向");
            analysisText = currentPersona.over;
            suggestions = currentPersona.overSuggests;
            nextSettings.grindSize = Math.round((grindSize + 0.2) * 10) / 10;
            // オーバー抽出時はプレインフュージョンを短く
            nextSettings.preinfusionOn = 1.5;
            nextSettings.preinfusionWait = 2.0;
            // 回転数を下げて微粉を抑える
            if (grinderSpeed > 2) nextSettings.grinderSpeed = grinderSpeed - 1;
            nextSettings.time = "24-26";
            if (temp > 90) nextSettings.temp = temp - 1;
        } 
        else if (isGood) {
            primaryIssue = "卓越した抽出バランス（神の一杯）";
            statusTags.push("グッドショット", "適正抽出");
            analysisText = currentPersona.good;
            suggestions = currentPersona.goodSuggests;
            nextSettings.grindSize = grindSize;
            nextSettings.grinderSpeed = grinderSpeed;
            nextSettings.time = `${Math.floor(time - 1)}-${Math.ceil(time + 1)}`;
        } 
        else {
            primaryIssue = "標準抽出（微調整プロファイリング）";
            statusTags.push("均衡調整フェーズ");
            analysisText = currentPersona.neutral;
            suggestions = currentPersona.neutralSuggests;
            
            if (acidity > bitterness) {
                nextSettings.grindSize = Math.round((grindSize - 0.1) * 10) / 10;
                nextSettings.preinfusionWait = Math.min(preinfusionWait + 0.5, 6.0);
            } else if (bitterness > acidity) {
                nextSettings.grindSize = Math.round((grindSize + 0.1) * 10) / 10;
                if (grinderSpeed > 2) nextSettings.grinderSpeed = grinderSpeed - 1;
            }
            nextSettings.time = "25-28";
        }

        // 定量的抽出比率チェックを追加
        if (brewRatio < 1.5) {
            statusTags.push("濃厚リストレット（比率低）");
            analysisText += `\n\n【プロのアドバイス】現在の抽出比率は ${brewRatio.toFixed(1)}倍（Ristretto）です。Linea Micraによる濃厚なコクは素晴らしいですが、豆の奥のフルーティーな甘み成分を引き出すために抽出量（Yield）を1:2比率の ${Math.round(dose * 2)}g 前後まで伸ばすアプローチが効果的です。`;
            if (!isGood && !isOverExtracted) {
                nextSettings.yield = Math.round(dose * 2);
            }
        } else if (brewRatio > 2.5) {
            statusTags.push("淡麗ルンゴ（比率高）");
            analysisText += `\n\n【プロのアドバイス】抽出比率が ${brewRatio.toFixed(1)}倍（Lungo）に達しています。ボディが軽くスッキリとしたクリアさがある反面、後半の渋みが混入しやすい状態です。後味にザラつきを感じる場合は、お湯を流しすぎず、抽出比率を ${Math.round(dose * 2)}g 前後で止めてお湯で割る（アメリカーノ方式）方がクリーンです。`;
            if (!isGood && !isUnderExtracted) {
                nextSettings.yield = Math.round(dose * 2);
            }
        }

        // クレマ品質チェックを追加
        if (crema <= 2) {
            statusTags.push("低クレマ (薄い/消えやすい)");
            analysisText += `\n\n【クレマのアドバイス】クレマが薄い、あるいは消えやすいようです。アロマを閉じ込めるクレマを豊かにするには、挽き目を細かくして抽出圧力を高めるか、使用するコーヒー豆の焙煎日を見直してください。焙煎から数日〜3週間以内の新鮮な豆を使用すると、炭酸ガスによって濃厚なクレマが生まれます。`;
        } else if (crema === 5) {
            statusTags.push("極上クレマ (濃厚/持続)");
            analysisText += `\n\n【クレマのアドバイス】非常に素晴らしい、密度が高く持続性のある極上のクレマが形成されています！これは豆の鮮度、グラインド（Lagom P64の粒度揃い）、そしてLinea Micraの安定した9bar抽出圧力が完璧に機能している証拠です。`;
        }

        // グラインダーRPM情報格納
        nextSettings.grinderRPM = this.convertToRPM(nextSettings.grinderSpeed);

        // --- 4. エスプレッソ抽出化学インジケータの動的推定演算 ---
        let estimatedEY = 19.5; // 基準抽出収率 (%)
        if (isUnderExtracted) {
            estimatedEY = 14.2 + (time / 20) * 2.5; // 抽出時間依存 (14% - 17.5%)
        } else if (isOverExtracted) {
            estimatedEY = 21.5 + (time / 32) * 1.5; // (21.5% - 24%)
        } else if (isChanneling) {
            estimatedEY = 14.5 + (time / 25) * 1.5; // チャネリングによるバイパス損
        } else {
            // 適正ゾーンでの官能値補正
            estimatedEY = 18.2 + (sweetness * 0.4) + (body * 0.3) + (balance * 0.2);
        }
        estimatedEY = Math.min(Math.max(estimatedEY, 10.0), 26.0);

        // TDS推定演算 (TDS = (Dose * EY) / Yield)
        let estimatedTDS = (dose * estimatedEY) / yieldAmount;
        estimatedTDS = Math.min(Math.max(estimatedTDS, 6.0), 15.0);

        // チャネリングリスク度演算 (%)
        let risk = 10; // ベース 10%
        if (isChanneling) {
            risk = 90;
        } else {
            // Lagom P64 挽目 < 1.8 でリスク急増
            if (grindSize < 1.8) {
                risk += Math.round((1.8 - grindSize) * 80);
            }
            // RPM > 1000 でリスク微増 (高回転による微粉の偏流要因)
            if (currentRPM > 1000) {
                risk += Math.round((currentRPM - 1000) / 10);
            }
            // Linea Micra プレインフュージョン無し or 短時間は高リスク
            if (preinfusionOn < 1.5 || preinfusionWait < 2.0) {
                risk += 25;
            } else if (preinfusionOn >= 2.5 && preinfusionWait >= 3.5) {
                risk -= 15; // 完全なプレウェットはリスク低下
            }
        }
        risk = Math.min(Math.max(risk, 5), 98);

        return {
            brewRatio: parseFloat(brewRatio.toFixed(2)),
            flowRate: parseFloat(flowRate.toFixed(2)),
            primaryIssue,
            statusTags,
            analysisText,
            suggestions,
            nextSettings,
            estimatedTDS: parseFloat(estimatedTDS.toFixed(2)),
            estimatedEY: parseFloat(estimatedEY.toFixed(2)),
            channelingRisk: Math.round(risk)
        };
    }
}

// ブラウザ/Nodeの両環境に対応
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BaristaAI;
} else {
    window.BaristaAI = BaristaAI;
}
