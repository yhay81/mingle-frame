import { product } from "../config/product";
import { Layout } from "./layout";

const interestSuggestions = ["写真", "ゲーム", "音楽", "お絵描き", "雑談", "イベント"];
const activitySlots = [
  ["morning", "朝", "6–12"],
  ["day", "昼", "12–18"],
  ["evening", "夜", "18–24"],
  ["late", "深夜", "0–6"],
] as const;
const contactOptions = [
  ["friend", "フレンド申請"],
  ["join", "Join"],
  ["dm", "DM"],
  ["vc", "VC"],
] as const;

export function HomePage() {
  return (
    <Layout>
      <section class="workspace-intro">
        <span class="intro-mark" aria-hidden="true">
          <i></i>
          <b></b>
          <em></em>
        </span>
        <div>
          <h1>{product.headline}</h1>
          <p>画像と項目を選ぶだけで、交流用カードがその場で仕上がります。</p>
        </div>
        <span class="local-badge">画像と入力は端末の外へ出ません</span>
      </section>

      <div class="frame-workbench">
        <aside class="edit-panel" aria-label="カードの編集">
          <header class="panel-header">
            <h2>カードを整える</h2>
            <output id="save-status">端末に保存</output>
          </header>

          <fieldset class="style-field">
            <legend>デザイン</legend>
            <div class="style-options">
              <label>
                <input checked name="style" type="radio" value="midnight" />
                <span class="style-midnight">
                  <i></i>
                  <b>Midnight</b>
                </span>
              </label>
              <label>
                <input name="style" type="radio" value="dawn" />
                <span class="style-dawn">
                  <i></i>
                  <b>Dawn</b>
                </span>
              </label>
              <label>
                <input name="style" type="radio" value="paper" />
                <span class="style-paper">
                  <i></i>
                  <b>Paper</b>
                </span>
              </label>
            </div>
          </fieldset>

          <div class="identity-fields">
            <label>
              <span>表示名</span>
              <input id="display-name" maxlength={24} placeholder="Mingle さん" />
            </label>
            <label>
              <span>ID</span>
              <input id="handle" maxlength={32} placeholder="@mingle" />
            </label>
            <label class="wide-field">
              <span>ひとこと</span>
              <input id="tagline" maxlength={46} placeholder="のんびり遊んでいます" />
            </label>
          </div>

          <fieldset class="image-field">
            <legend>画像</legend>
            <div class="image-slots" id="image-slots">
              {[0, 1, 2].map((index) => (
                <label data-slot={index}>
                  <input accept="image/jpeg,image/png,image/webp" data-image-input type="file" />
                  <span>
                    <i aria-hidden="true">{index + 1}</i>
                    <b>{index === 0 ? "メイン" : `追加${index}`}</b>
                  </span>
                </label>
              ))}
            </div>
            <div class="image-controls" id="image-controls" hidden>
              <label>
                <span>左右</span>
                <input id="image-x" max="100" min="-100" type="range" value="0" />
              </label>
              <label>
                <span>上下</span>
                <input id="image-y" max="100" min="-100" type="range" value="0" />
              </label>
              <label>
                <span>大きさ</span>
                <input id="image-zoom" max="220" min="80" type="range" value="100" />
              </label>
              <button id="remove-image" type="button">
                この画像を外す
              </button>
            </div>
          </fieldset>

          <fieldset class="interest-field">
            <legend>
              好きなこと <small>6つまで</small>
            </legend>
            <div class="tag-input-row">
              <input id="interest-input" maxlength={16} placeholder="タグを追加" />
              <button id="add-interest" type="button">
                追加
              </button>
            </div>
            <div class="suggestion-row" id="interest-suggestions">
              {interestSuggestions.map((item) => (
                <button data-interest={item} type="button">
                  + {item}
                </button>
              ))}
            </div>
            <div class="selected-tags" id="selected-interests"></div>
          </fieldset>
        </aside>

        <section class="preview-panel" aria-labelledby="preview-title">
          <header class="preview-header">
            <div>
              <span>LIVE PREVIEW</span>
              <h2 id="preview-title">完成カード</h2>
            </div>
            <div class="ratio-switch">
              <button aria-pressed="true" data-ratio="wide" type="button">
                16:9
              </button>
              <button aria-pressed="false" data-ratio="square" type="button">
                1:1
              </button>
            </div>
          </header>
          <div class="canvas-stage">
            <canvas height="675" id="profile-canvas" width="1200">
              完成した自己紹介カード
            </canvas>
          </div>
          <div class="export-bar">
            <div>
              <span id="export-size">1200 × 675 PNG</span>
              <small>投稿前に内容と画像の権利を確認してください。</small>
            </div>
            <button class="copy-button" id="copy-post" type="button">
              投稿文をコピー
            </button>
            <button class="download-button" id="download-card" type="button">
              PNGを保存
            </button>
          </div>
        </section>

        <aside class="detail-panel" aria-label="交流情報">
          <section class="detail-card">
            <header class="panel-header">
              <h2>活動時間</h2>
              <span>複数選択</span>
            </header>
            <div class="activity-options" id="activity-options">
              {activitySlots.map(([value, label, time], index) => (
                <label>
                  <input checked={index > 1} name="activity" type="checkbox" value={value} />
                  <span>
                    <i></i>
                    <strong>{label}</strong>
                    <small>{time}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section class="detail-card">
            <header class="panel-header">
              <h2>関わり方</h2>
              <span>OKなもの</span>
            </header>
            <div class="contact-options" id="contact-options">
              {contactOptions.map(([value, label], index) => (
                <label>
                  <input checked={index < 3} name="contact" type="checkbox" value={value} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section class="detail-card text-detail">
            <label>
              <span>よくいる場所・遊び方</span>
              <textarea
                id="places"
                maxlength={90}
                placeholder="Public巡り、写真撮影、イベント参加など"
                rows={3}
              ></textarea>
            </label>
            <label>
              <span>先に伝えたいこと</span>
              <textarea
                id="boundaries"
                maxlength={80}
                placeholder="急なタメ口は苦手、聞き専あり など"
                rows={3}
              ></textarea>
            </label>
          </section>

          <section class="detail-card accent-card">
            <header class="panel-header">
              <h2>アクセント</h2>
              <output id="accent-value">#79F2C0</output>
            </header>
            <div class="accent-row" id="accent-row">
              {["#79F2C0", "#FF8D7B", "#9DB7FF", "#FFD166", "#D7A6FF"].map((color, index) => (
                <button
                  aria-label={`${color}を選ぶ`}
                  aria-pressed={index === 0 ? "true" : "false"}
                  data-color={color}
                  style={`--swatch:${color}`}
                  type="button"
                ></button>
              ))}
            </div>
          </section>

          <section class="data-card">
            <p>
              画像とプロフィールはこのブラウザ内だけで処理します。画像は保存せず、文字設定だけを端末へ残します。
            </p>
            <button id="reset-card" type="button">
              入力を初期化
            </button>
          </section>
        </aside>
      </div>
    </Layout>
  );
}

export function PrivacyPage() {
  return (
    <Layout page="privacy" title={`プライバシー | ${product.name}`}>
      <article class="prose">
        <h1>画像とプロフィールは、この端末の中で扱います</h1>
        <h2>サーバーへ送らないもの</h2>
        <p>
          選んだ画像、表示名、各サービスのID、ひとこと、好きなこと、活動時間、関わり方、よくいる場所、先に伝えたいことはMingle
          FrameのAPIへ送信しません。画像処理とPNG生成はブラウザ内で完結します。
        </p>
        <h2>端末へ保存するもの</h2>
        <p>
          画像を除く入力内容とデザイン設定はlocalStorageへ保存します。画像は再訪時に残しません。ブラウザのサイトデータを消すと文字設定も削除できます。
        </p>
        <h2>匿名で集計するもの</h2>
        <p>
          閲覧、画像追加、カード完成、PNG保存、投稿文コピー、別日再訪を、匿名識別子を一方向変換して日単位で記録します。入力内容、画像名、ID、色、IPアドレスはD1へ保存せず、匿名集計は35日後に削除します。
        </p>
      </article>
    </Layout>
  );
}

export function NotFoundPage() {
  return (
    <Layout page="not-found" title={`見つかりません | ${product.name}`}>
      <section class="not-found">
        <span aria-hidden="true">▣ ◫ ◧</span>
        <h1>ページが見つかりません</h1>
        <p>カード作成画面へ戻って、一枚を仕上げられます。</p>
        <a href="/">カード作成へ戻る</a>
      </section>
    </Layout>
  );
}
