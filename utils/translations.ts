
import { Keyword, Language } from '../types';

interface Translation {
  title: string;
  titleSuffix: string;
  description: string;
  startAnalysis: string;
  analyzing: string;
  analyzingDeep: string;
  errorTitle: string;
  processError: string;
  noKeywordsError: string;
  settings: {
    label: string;
    providers: {
        web_speech: string;
        gemini: string;
    }
  };
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
    removeFile: string;
    timeLimitReached: string;
    exampleCase: {
        title: string;
        fileName: string;
    };
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
    fuzzyRate: string;
    combinedRate: string;
  };
}

export const translations: Record<Language, Translation> = {
  zh: {
    title: "语音关键词",
    titleSuffix: "识别助手",
    description: "上传或录制音频，利用 AI 自动转录并检测特定关键词。",
    startAnalysis: "开始分析",
    analyzing: "分析中...",
    analyzingDeep: "深度语义匹配中...",
    errorTitle: "错误",
    processError: "处理音频时发生错误。",
    noKeywordsError: "请至少添加一个关键词进行搜索。",
    settings: {
        label: "语音识别引擎",
        providers: {
            web_speech: "浏览器原生 (快速/免费)",
            gemini: "Gemini AI (高精度)"
        }
    },
    audioInput: {
      tabs: {
        record: "录制音频",
        upload: "上传文件"
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
      transcribing: "正在转录音频...",
      removeFile: "删除文件",
      timeLimitReached: "已达到最大录音时长（30分钟）",
      exampleCase: {
          title: "案例演示",
          fileName: "Digital_Transformation_Case.m4a"
      }
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
      hitRate: "精准触及率",
      fuzzyRate: "模糊触及率",
      combinedRate: "综合触及率"
    }
  },
  en: {
    title: "Voice Keyword",
    titleSuffix: "Recognizer",
    description: "Upload or record audio, use AI to transcribe and detect specific keywords.",
    startAnalysis: "Start Analysis",
    analyzing: "Analyzing...",
    analyzingDeep: "Deep Semantic Matching...",
    errorTitle: "Error",
    processError: "An error occurred while processing audio.",
    noKeywordsError: "Please add at least one keyword.",
    settings: {
        label: "STT Engine",
        providers: {
            web_speech: "Browser Native (Fast/Free)",
            gemini: "Gemini AI (High Accuracy)"
        }
    },
    audioInput: {
      tabs: {
        record: "Record Audio",
        upload: "Upload File"
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
      transcribing: "Transcribing audio...",
      removeFile: "Remove File",
      timeLimitReached: "Maximum recording time reached (30 minutes)",
      exampleCase: {
          title: "Example Case",
          fileName: "Digital_Transformation_Case.m4a"
      }
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
      hitRate: "Exact Match Rate",
      fuzzyRate: "Fuzzy Match Rate",
      combinedRate: "Combined Hit Rate"
    }
  },
  ja: {
    title: "音声キーワード",
    titleSuffix: "認識ツール",
    description: "音声をアップロードまたは録音し、AIを活用して自動文字起こしとキーワード検出を行います。",
    startAnalysis: "分析開始",
    analyzing: "分析中...",
    analyzingDeep: "詳細セマンティックマッチング中...",
    errorTitle: "エラー",
    processError: "音声処理中にエラーが発生しました。",
    noKeywordsError: "キーワードを少なくとも1つ追加してください。",
    settings: {
        label: "認識エンジン",
        providers: {
            web_speech: "ブラウザ標準 (高速/無料)",
            gemini: "Gemini AI (高精度)"
        }
    },
    audioInput: {
      tabs: {
        record: "音声録音",
        upload: "ファイルアップロード"
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
      transcribing: "音声を文字起こし中...",
      removeFile: "ファイルを削除",
      timeLimitReached: "録音時間の制限（30分）に達しました",
      exampleCase: {
          title: "ケースデモ",
          fileName: "Digital_Transformation_Case.m4a"
      }
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
      hitRate: "完全一致率",
      fuzzyRate: "あいまい一致率",
      combinedRate: "総合一致率"
    }
  }
};

export const INITIAL_KEYWORDS_BY_LANG: Record<Language, Keyword[]> = {
  zh: [
    { id: 'zh-1', text: '数字化转型', detected: false },
    { id: 'zh-2', text: '数据平台', detected: false },
    { id: 'zh-9', text: '节能减排', detected: false },
    { id: 'zh-10', text: '跨部门协同', detected: false },
    { id: 'zh-11', text: '创新业务', detected: false },
    { id: 'zh-12', text: '智能硬件', detected: false },
    { id: 'zh-13', text: '智慧城市', detected: false },
    { id: 'zh-14', text: '城市能耗预测', detected: false },
    { id: 'zh-15', text: '绿色建筑', detected: false },
    { id: 'zh-16', text: '被动式设计', detected: false },
    { id: 'zh-17', text: '智能交通系统', detected: false },
    { id: 'zh-18', text: '传感器', detected: false },
    { id: 'zh-19', text: '空气污染', detected: false },
    { id: 'zh-20', text: '工业革命', detected: false },
    { id: 'zh-21', text: '能源分配', detected: false },
    { id: 'zh-22', text: '城市基础设施', detected: false },
    { id: 'zh-23', text: '城市更新', detected: false },
    { id: 'zh-24', text: '城市可持续发展', detected: false },
    { id: 'zh-25', text: '热岛效应', detected: false },
    { id: 'zh-26', text: '地下交通系统', detected: false },
    { id: 'zh-27', text: '互动展示技术', detected: false },
    { id: 'zh-28', text: '城市人口密度', detected: false },
    { id: 'zh-29', text: '能源管理平台', detected: false },
    { id: 'zh-30', text: '气候适应型建筑', detected: false },
    { id: 'zh-31', text: '城市排水系统', detected: false },
    { id: 'zh-32', text: '公共交通效率', detected: false },
    { id: 'zh-33', text: '数据可视化', detected: false },
    { id: 'zh-34', text: '建筑材料科技', detected: false },
    { id: 'zh-35', text: '城市声环境', detected: false },
    { id: 'zh-36', text: '市政工程管理', detected: false },
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
