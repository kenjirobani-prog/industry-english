import { SiteHeader } from '@/components/SiteHeader';
import { FileUpload } from '@/components/FileUpload';

export default function UploadPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8 text-center">
            <div className="text-[10px] font-display uppercase tracking-widest text-gold">
              Personalize
            </div>
            <h1 className="font-display text-3xl text-amber-200 mb-3">
              あなたの資料から<br />キーワードを抽出
            </h1>
            <p className="text-sm text-amber-100/70 leading-relaxed">
              ピッチ資料、ブランドデッキ、契約書、議事録—<br />
              あなたが日常で触れる資料ほど、<br className="sm:hidden" />
              学ぶべき単語が眠っています。
            </p>
          </div>

          <FileUpload />

          <div className="mt-10 rounded-2xl border border-border-soft bg-surface-1/60 p-5 text-[11px] text-amber-100/60 leading-relaxed">
            <div className="font-display text-amber-200 tracking-wider uppercase text-xs mb-2">
              MVPの制限
            </div>
            現在は解析処理をモックしています。本番版では、アップロードされた資料から
            業界固有のキーワードを自動抽出し、あなた専用のレッスンを生成します。
          </div>
        </div>
      </main>
    </>
  );
}
