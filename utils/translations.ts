import { Keyword, Language } from '../types';

interface Translation {
  title: string;
  titleSuffix: string;
  description: string;
  startAnalysis: string;
  analyzing: string;
  errorTitle: string;
  processError: string;
  noKeywordsError: string;
  audioInput: {
    tabs: {
      record: string;
      upload: string;
    };
    recording: string;
    startRecording: string;
    permissionPrompt: string;
    uploadPrompt: string;
    uploadDesc: string;
    previewTitle: string;
    transcriptionTitle: string;
    clickToExpand: string;
    clickToCollapse: string;
    transcribing: string;
  };
  keywordManager: {
    title: string;
    reset: string;
    inputPlaceholder: string;
    add: string;
    emptyState: {
      title: string;
      desc: string;
    };
    found: string;
    duplicateError: string;
    deleteAria: string;
    editAria: string;
    saveAria: string;
    cancelAria: string;
    maxCharError: string;
    maxCountError: string;
    hitRate: string;
  };
}

export const translations: Record<Language, Translation> = {
  zh: {
    title: "语音关键词",
    titleSuffix: "识别助手",
    description: "上传或录制音频，利用 AI 自动转录并检测特定关键词。",
    startAnalysis: "🔍 开始分析",
    analyzing: "分析中...",
    errorTitle: "错误",
    processError: "处理音频时发生错误。",
    noKeywordsError: "请至少添加一个关键词进行搜索。",
    audioInput: {
      tabs: {
        record: "🎙️ 录制音频",
        upload: "📤 上传文件"
      },
      recording: "停止录音",
      startRecording: "开始录音",
      permissionPrompt: "请确保已授予麦克风权限。",
      uploadPrompt: "点击此处上传",
      uploadDesc: "支持 MP3, WAV, AAC (最大 10MB)",
      previewTitle: "音频预览",
      transcriptionTitle: "完整转录文本",
      clickToExpand: "点击展开查看详情",
      clickToCollapse: "点击收起详情",
      transcribing: "正在转录音频..."
    },
    keywordManager: {
      title: "关键词列表",
      reset: "重置结果",
      inputPlaceholder: "输入关键词...",
      add: "添加",
      emptyState: {
        title: "暂无关键词。",
        desc: "添加您希望在音频中检测的词语。"
      },
      found: "已发现",
      duplicateError: "该关键词已存在！",
      deleteAria: "删除关键词",
      editAria: "编辑关键词",
      saveAria: "保存修改",
      cancelAria: "取消修改",
      maxCharError: "字符超出限制（中文10字，英文20字）",
      maxCountError: "关键词列表已达上限（100个）",
      hitRate: "关键词触及率"
    }
  },
  en: {
    title: "Voice Keyword",
    titleSuffix: "Recognizer",
    description: "Upload or record audio, use AI to transcribe and detect specific keywords.",
    startAnalysis: "🔍 Start Analysis",
    analyzing: "Analyzing...",
    errorTitle: "Error",
    processError: "An error occurred while processing audio.",
    noKeywordsError: "Please add at least one keyword.",
    audioInput: {
      tabs: {
        record: "🎙️ Record Audio",
        upload: "📤 Upload File"
      },
      recording: "Stop Recording",
      startRecording: "Start Recording",
      permissionPrompt: "Please ensure microphone permission is granted.",
      uploadPrompt: "Click to Upload",
      uploadDesc: "Supports MP3, WAV, AAC (Max 10MB)",
      previewTitle: "Audio Preview",
      transcriptionTitle: "Full Transcription",
      clickToExpand: "Click to expand",
      clickToCollapse: "Click to collapse",
      transcribing: "Transcribing audio..."
    },
    keywordManager: {
      title: "Keyword List",
      reset: "Reset Results",
      inputPlaceholder: "Enter keyword...",
      add: "Add",
      emptyState: {
        title: "No keywords yet.",
        desc: "Add words you want to detect in the audio."
      },
      found: "Found",
      duplicateError: "Keyword already exists!",
      deleteAria: "Delete keyword",
      editAria: "Edit keyword",
      saveAria: "Save changes",
      cancelAria: "Cancel changes",
      maxCharError: "Character limit exceeded (10 for CJK, 20 for English)",
      maxCountError: "Maximum 100 keywords reached",
      hitRate: "Keyword Hit Rate"
    }
  },
  ja: {
    title: "音声キーワード",
    titleSuffix: "認識ツール",
    description: "音声をアップロードまたは録音し、AIを活用して自動文字起こしとキーワード検出を行います。",
    startAnalysis: "🔍 分析開始",
    analyzing: "分析中...",
    errorTitle: "エラー",
    processError: "音声処理中にエラーが発生しました。",
    noKeywordsError: "キーワードを少なくとも1つ追加してください。",
    audioInput: {
      tabs: {
        record: "🎙️ 音声録音",
        upload: "📤 ファイルアップロード"
      },
      recording: "録音停止",
      startRecording: "録音開始",
      permissionPrompt: "マイクの権限が許可されていることを確認してください。",
      uploadPrompt: "クリックしてアップロード",
      uploadDesc: "MP3, WAV, AAC 対応 (最大 10MB)",
      previewTitle: "音声プレビュー",
      transcriptionTitle: "文字起こし結果",
      clickToExpand: "クリックして展開",
      clickToCollapse: "クリックして折りたたむ",
      transcribing: "音声を文字起こし中..."
    },
    keywordManager: {
      title: "キーワード一覧",
      reset: "結果をリセット",
      inputPlaceholder: "キーワードを入力...",
      add: "追加",
      emptyState: {
        title: "キーワードがありません。",
        desc: "検出したい単語を追加してください。"
      },
      found: "検出",
      duplicateError: "このキーワードは既に存在します！",
      deleteAria: "キーワードを削除",
      editAria: "キーワードを編集",
      saveAria: "変更を保存",
      cancelAria: "変更をキャンセル",
      maxCharError: "文字数制限を超えています（日本語10文字、英語20文字）",
      maxCountError: "キーワード数が上限（100個）に達しました",
      hitRate: "キーワード検出率"
    }
  }
};

export const INITIAL_KEYWORDS_BY_LANG: Record<Language, Keyword[]> = {
  zh: [
    { id: 'zh-1', text: '你好', detected: false },
    { id: 'zh-2', text: '紧急', detected: false },
    { id: 'zh-3', text: '帮助', detected: false },
    { id: 'zh-4', text: '联系客服', detected: false },
  ],
  en: [
    { id: 'en-1', text: 'Hello', detected: false },
    { id: 'en-2', text: 'Urgent', detected: false },
    { id: 'en-3', text: 'Help', detected: false },
    { id: 'en-4', text: 'Support', detected: false },
  ],
  ja: [
    { id: 'ja-1', text: 'こんにちは', detected: false },
    { id: 'ja-2', text: '緊急', detected: false },
    { id: 'ja-3', text: '助けて', detected: false },
    { id: 'ja-4', text: 'サポート', detected: false },
  ]
};