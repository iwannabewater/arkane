import type { VaultCategory } from "../types";

export type AppLanguage = "en" | "zh";

const LANGUAGE_STORAGE_KEY = "arkane:language";

export function initialLanguage(): AppLanguage {
  try {
    const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "zh") {
      return stored;
    }
  } catch {
    // Language should still follow the browser preference if storage is unavailable.
  }
  if (typeof navigator === "undefined") {
    return "en";
  }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function persistLanguage(language: AppLanguage) {
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Keep the one-click switch functional even when persistence is blocked.
  }
}

export function nextLanguage(language: AppLanguage): AppLanguage {
  return language === "en" ? "zh" : "en";
}

export const copy = {
  en: {
    app: {
      securingSession: "Securing session",
      savingSnapshot: "Saving an encrypted local snapshot",
      offlineWarning: "Offline, writes will retry after reconnect"
    },
    language: {
      aria: "Switch language",
      next: "Switch to Chinese",
      en: "EN",
      zh: "中"
    },
    gateway: {
      eyebrow: "Arkane secure gateway",
      title: "Arkane",
      tagline: "A quiet encrypted vault for credentials, assets, and recovery traces.",
      proof: "Client-side AES-GCM. Private GitHub sync. No telemetry.",
      signals: [
        { value: "AES-GCM", label: "client-side" },
        { value: "PWA", label: "offline shell" },
        { value: "GitHub", label: "private sync" }
      ],
      storedToken: "token stored in this browser",
      quickPinTitle: "Quick PIN",
      quickPinHelp: "Expires after 8 hours. Three failed attempts disable it.",
      quickPinLabel: "6-digit Quick PIN",
      quickPinPlaceholder: "••••••",
      quickPinSubmit: "Unlock",
      masterTitle: "Master unlock",
      masterHelp: "The master password stays in memory only.",
      tokenLabel: "GitHub Personal Access Token",
      tokenPlaceholder: "github_pat_...",
      tokenHelp: "Stored in this browser to reconnect. Use a fine-grained token limited to your private vault repository.",
      repoLabel: "Private repo",
      repoPlaceholder: "username/arkane-vault",
      branchLabel: "Branch",
      pathLabel: "Vault path",
      passwordLabel: "Master password",
      quickPinSetLabel: "Set 6-digit Quick PIN",
      quickPinSetPlaceholder: "optional",
      quickPinSetHelp: "Optional device-session convenience. It does not replace the master password.",
      openVault: "Open vault",
      securityNote: "Public shell, private ciphertext. Your vault content leaves the browser only as an encrypted envelope."
    },
    lock: {
      eyebrow: "Session locked",
      title: "Arkane",
      pinLabel: "6-digit Quick PIN",
      help: "The decrypted vault has been removed from the screen. Three incorrect PIN entries require the master password.",
      masterPassword: "Master password",
      unlock: "Unlock"
    },
    workspace: {
      categories: {
        credentials: { nav: "Credentials", title: "Credentials", eyebrow: "Credentials" },
        assets: { nav: "Assets", title: "Assets", eyebrow: "Assets" },
        footprints: { nav: "Footprints", title: "Footprints", eyebrow: "Footprints" },
        sentry: { nav: "Recovery", title: "Recovery notes", eyebrow: "Vault sentry" }
      } satisfies Record<VaultCategory, { nav: string; title: string; eyebrow: string }>,
      headerEyebrow: "Arkane vault",
      noRepository: "No repository",
      syncNow: "Sync now",
      sync: "Sync",
      lockVault: "Lock vault",
      disconnect: "Disconnect GitHub credentials",
      metrics: {
        credentials: "Credentials",
        assets: "Assets",
        footprints: "Footprints",
        due: "Due in 30d"
      },
      expiryTitle: "Expiry sentry",
      noExpiry: "No items expiring within 30 days.",
      connectionTitle: "GitHub uplink",
      repository: "Repository",
      token: "Token",
      tokenStored: "Stored in this browser",
      none: "None",
      network: "Network",
      online: "Online",
      offline: "Offline",
      status: "Status",
      vaultFile: "Vault file",
      repo: "Repo",
      add: "Add",
      emptyTitle: "No encrypted items yet",
      emptyBody: "Add a record when you are ready to sync it.",
      deleteAria: "Delete",
      deleteConfirmPrefix: "Delete",
      deleteConfirmSuffix: "The encrypted deletion will sync to your repository.",
      copyAria: "Copy",
      revealAria: "Reveal",
      hideAria: "Hide",
      concealedValue: "•••• •••• •••• ••••",
      vaultEncryptedBlob: "vault-encrypted blob",
      copiedSuffix: "copied. Clear your clipboard after use.",
      clipboardFailed: "Clipboard access failed. Copy the value manually.",
      encryptedCommitQueued: "Encrypted commit queued",
      expiryState: {
        noExpiry: "No expiry",
        invalidDate: "Invalid date",
        dueToday: "Due today",
        overdueSuffix: "d overdue",
        leftSuffix: "d left"
      },
      sentry: {
        title: "Recovery notes",
        eyebrow: "Vault sentry",
        emergencyNote: "Emergency note",
        recoveryHint: "Recovery hint",
        reminderTitle: "Local-only reminders",
        reminderBody:
          "Arkane calculates expiry status in your browser. Recovery notes and item metadata are never sent to a notification service."
      },
      addSheet: {
        title: "New encrypted item",
        close: "Close",
        itemTitle: "Title",
        subtitle: "Subtitle",
        fieldLabel: "Field label",
        expiry: "Expiry",
        secretValue: "Secret value",
        conceal: "Conceal field by default",
        attach: "Attach encrypted preview",
        cancel: "Cancel",
        submit: "Encrypt item",
        defaultLabel: "Document number",
        fileTooLarge: "Attachment limit is 750 KB for this template.",
        fileType: "Use a PNG, JPEG, WebP, or GIF image.",
        fileRead: "The selected attachment could not be read.",
        encryptedPreview: "Stored inside the encrypted vault payload"
      }
    }
  },
  zh: {
    app: {
      securingSession: "正在保护会话",
      savingSnapshot: "正在保存本地加密快照",
      offlineWarning: "当前离线，写入会在重新联网后重试"
    },
    language: {
      aria: "切换语言",
      next: "切换到英文",
      en: "EN",
      zh: "中"
    },
    gateway: {
      eyebrow: "Arkane 安全入口",
      title: "Arkane",
      tagline: "给凭据、资产和恢复线索使用的安静加密金库。",
      proof: "浏览器本地 AES-GCM 加密。私有 GitHub 同步。没有遥测。",
      signals: [
        { value: "AES-GCM", label: "本地加密" },
        { value: "PWA", label: "离线外壳" },
        { value: "GitHub", label: "私有同步" }
      ],
      storedToken: "令牌已保存在此浏览器",
      quickPinTitle: "快速 PIN",
      quickPinHelp: "8 小时后过期，连续三次失败会停用。",
      quickPinLabel: "6 位快速 PIN",
      quickPinPlaceholder: "••••••",
      quickPinSubmit: "解锁",
      masterTitle: "主密码解锁",
      masterHelp: "主密码只停留在内存中。",
      tokenLabel: "GitHub 个人访问令牌",
      tokenPlaceholder: "github_pat_...",
      tokenHelp: "此令牌会保存在浏览器中用于重新连接。请使用只授权私有金库仓库的精细令牌。",
      repoLabel: "私有仓库",
      repoPlaceholder: "username/arkane-vault",
      branchLabel: "分支",
      pathLabel: "金库路径",
      passwordLabel: "主密码",
      quickPinSetLabel: "设置 6 位快速 PIN",
      quickPinSetPlaceholder: "可选",
      quickPinSetHelp: "仅用于当前设备会话的便捷入口，不能替代主密码。",
      openVault: "打开金库",
      securityNote: "公开应用外壳，私有密文数据。你的金库内容只会以加密信封离开浏览器。"
    },
    lock: {
      eyebrow: "会话已锁定",
      title: "Arkane",
      pinLabel: "6 位快速 PIN",
      help: "解密后的金库已经从屏幕移除。连续三次 PIN 错误后需要使用主密码。",
      masterPassword: "主密码",
      unlock: "解锁"
    },
    workspace: {
      categories: {
        credentials: { nav: "凭据", title: "凭据", eyebrow: "凭据" },
        assets: { nav: "资产", title: "资产", eyebrow: "资产" },
        footprints: { nav: "足迹", title: "足迹", eyebrow: "足迹" },
        sentry: { nav: "恢复", title: "恢复线索", eyebrow: "金库哨兵" }
      } satisfies Record<VaultCategory, { nav: string; title: string; eyebrow: string }>,
      headerEyebrow: "Arkane 金库",
      noRepository: "未连接仓库",
      syncNow: "立即同步",
      sync: "同步",
      lockVault: "锁定金库",
      disconnect: "断开 GitHub 凭据",
      metrics: {
        credentials: "凭据",
        assets: "资产",
        footprints: "足迹",
        due: "30 天内到期"
      },
      expiryTitle: "到期哨兵",
      noExpiry: "未来 30 天内没有即将到期的项目。",
      connectionTitle: "GitHub 链路",
      repository: "仓库",
      token: "令牌",
      tokenStored: "已保存在此浏览器",
      none: "无",
      network: "网络",
      online: "在线",
      offline: "离线",
      status: "状态",
      vaultFile: "金库文件",
      repo: "仓库",
      add: "新增",
      emptyTitle: "还没有加密项目",
      emptyBody: "准备同步时，新增一条记录即可。",
      deleteAria: "删除",
      deleteConfirmPrefix: "删除",
      deleteConfirmSuffix: "这次加密删除会同步到你的仓库。",
      copyAria: "复制",
      revealAria: "显示",
      hideAria: "隐藏",
      concealedValue: "•••• •••• •••• ••••",
      vaultEncryptedBlob: "金库加密附件",
      copiedSuffix: "已复制。用完后请清空剪贴板。",
      clipboardFailed: "无法访问剪贴板，请手动复制。",
      encryptedCommitQueued: "加密提交已排队",
      expiryState: {
        noExpiry: "无到期日",
        invalidDate: "日期无效",
        dueToday: "今日到期",
        overdueSuffix: "天逾期",
        leftSuffix: "天剩余"
      },
      sentry: {
        title: "恢复线索",
        eyebrow: "金库哨兵",
        emergencyNote: "紧急说明",
        recoveryHint: "恢复提示",
        reminderTitle: "只在本地提醒",
        reminderBody: "Arkane 只在浏览器里计算到期状态。恢复线索和项目元数据不会发送到通知服务。"
      },
      addSheet: {
        title: "新增加密项目",
        close: "关闭",
        itemTitle: "标题",
        subtitle: "副标题",
        fieldLabel: "字段名称",
        expiry: "到期日",
        secretValue: "秘密值",
        conceal: "默认隐藏字段",
        attach: "附加加密预览",
        cancel: "取消",
        submit: "加密保存",
        defaultLabel: "文档编号",
        fileTooLarge: "附件上限为 750 KB。",
        fileType: "请使用 PNG、JPEG、WebP 或 GIF 图片。",
        fileRead: "无法读取所选附件。",
        encryptedPreview: "保存在加密金库载荷中"
      }
    }
  }
} as const;

const syncMessages: Record<string, string> = {
  "No active vault": "没有打开的金库",
  "Offline shell cached": "离线外壳已缓存",
  "Update available after refresh": "刷新后可使用新版本",
  "Connecting to private GitHub repo": "正在连接私有 GitHub 仓库",
  "Restoring encrypted session snapshot": "正在恢复加密会话快照",
  "Vault decrypted in memory": "金库已在内存中解密",
  "New empty vault created": "已创建新的空金库",
  "Encrypted local changes restored and awaiting sync": "已恢复本地加密改动，等待同步",
  "Encrypting and committing vault": "正在加密并提交金库",
  "Encrypted vault committed": "加密金库已提交",
  "Committed; encrypted session cache unavailable": "已提交，但加密会话缓存不可用",
  "Encrypted commit queued": "加密提交已排队",
  "Vault already up to date": "金库已经是最新状态",
  "Checking encrypted vault revision": "正在检查加密金库版本",
  "Remote vault refreshed": "远端金库已刷新",
  "Remote refreshed; encrypted session cache unavailable": "远端已刷新，但加密会话缓存不可用",
  "Quick PIN unlock complete": "快速 PIN 解锁完成",
  "Encrypted local changes held until unlock": "本地加密改动会保留到下次解锁",
  "Session locked": "会话已锁定",
  "Unlock to sync encrypted local changes": "解锁后同步本地加密改动",
  "Master unlock required": "需要主密码解锁",
  "GitHub is unavailable.": "GitHub 暂时不可用。",
  "Quick PIN failed.": "快速 PIN 失败。",
  "Unlock failed.": "解锁失败。",
  "Unable to sync vault.": "无法同步金库。",
  "Unable to lock session safely.": "无法安全锁定会话。"
};

const errorMessages: Record<string, string> = {
  "GitHub PAT is required.": "需要 GitHub 个人访问令牌。",
  "Repo name must look like owner/private-repo.": "仓库名需要类似 owner/private-repo。",
  "Master password must be at least 10 characters.": "主密码至少需要 10 个字符。",
  "Quick PIN must be exactly 6 digits.": "快速 PIN 必须正好是 6 位数字。",
  "Quick PIN is not available. Use the master password.": "快速 PIN 不可用，请使用主密码。",
  "Quick PIN session has expired.": "快速 PIN 会话已过期。",
  "Quick PIN could not unlock this session.": "快速 PIN 无法解锁此会话。",
  "Quick PIN disabled after three failed attempts. Use the master password.": "快速 PIN 已因三次失败停用，请使用主密码。",
  "vault.json was not found in the configured repo.": "在配置的仓库中没有找到 vault.json。",
  "Remote vault changed while encrypted local changes were waiting. Reconcile before syncing.":
    "等待同步期间远端金库发生变化。请先处理冲突再同步。",
  "Remote vault was removed while encrypted local changes were waiting.": "等待同步期间远端金库被移除。",
  "Encrypted session metadata is missing.": "缺少加密会话元数据。",
  "Unable to decrypt vault. Check the master password or vault file.": "无法解密金库。请检查主密码或金库文件。",
  "Vault path must point to a JSON file.": "金库路径必须指向一个 JSON 文件。",
  "GitHub did not return the updated file SHA.": "GitHub 没有返回更新后的文件 SHA。"
};

export function localizeSyncMessage(message: string, language: AppLanguage): string {
  if (language === "en") {
    return message;
  }
  if (message.startsWith("Unlocked from encrypted snapshot; sync unavailable: ")) {
    return `已从加密快照解锁，但暂时无法同步：${message.replace(
      "Unlocked from encrypted snapshot; sync unavailable: ",
      ""
    )}`;
  }
  return syncMessages[message] ?? message;
}

export function localizeError(error: unknown, fallback: string, language: AppLanguage): string {
  const message = error instanceof Error ? error.message : fallback;
  if (language === "en") {
    return message;
  }
  if (message.startsWith("Quick PIN failed. ") && message.includes("remaining")) {
    const attempts = message.match(/\d+/)?.[0] ?? "";
    return `快速 PIN 失败。还剩 ${attempts} 次尝试。`;
  }
  return errorMessages[message] ?? syncMessages[message] ?? message;
}
