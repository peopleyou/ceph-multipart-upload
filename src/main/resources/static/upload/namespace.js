
/**
 * js控件
 */
var comp = comp || {};

/**
 * 字典类型
 */
var dictionary = dictionary || {
    //字典类型, 与DictionaryEnum.java同步
    FORM_TYPE: "formType",
    FORM_USE_OBJ: "formUseObj",
    FORM_STATE: "formState"
};

/**
 * profile
 */
var profile = profile || {
    DEV: "dev",
    TEST: "test",
    PRODUCT: "product"
};

/**
 * 文件管理
 */
var file = file || {

    //文件类型
    FILE_TYPE_SCHOOL: 1,
    FILE_TYPE_USER: 2,

    //当前菜单
    //用户个人文件管理
    CURRENT_MENU_USER: 1,
    //学校文件管理
    CURRENT_MENU_SCHOOL: 2,
    //用户已分享文件
    CURRENT_MENU_USER_SHARE: 3,
    //学校协作文件--我发起的
    CURRENT_MENU_SCHOOL_COOPERATE_MINE: 4,
    //学校文件访问权限
    CURRENT_MENU_SCHOOL_ROLE: 5,
    //学校协作文件--我参与的
    CURRENT_MENU_SCHOOL_COOPERATE_JOIN: 6,

    //用户个人文件请求uri
    DISK_FILE_USER_URI: "/disk/file/user",
    //学校文件请求uri
    DISK_FILE_SCHOOL_URI: "/disk/file/school",
    //pdf文件预览
    DISK_FILE_PERVIEW_URI: "/disk/file/pdf",
    //用户已分享文件请求uri
    DISK_FILE_USER_SHARE_URI: "/disk/file/user-share",
    //学校协作文件--我发起的，请求uri
    DISK_FILE_SCHOOL_COOPERATE_MINE_URI: "/disk/file/school-cooperate/mine",
    //学校协作文件--我参与的，请求uri
    DISK_FILE_SCHOOL_COOPERATE_JOIN_URI: "/disk/file/school-cooperate/join",
    //学校文件访问权限设置请求uri
    DISK_FILE_SCHOOL_ROLE_URI: "/disk/file/school/role",
    //学校文件访问权限值请求uri
    DISK_FILE_SCHOOL_ROLE_RESOURCE_URI: "/disk/file/school/role-resource",

    //当前请求菜单类型，作为一个全局变量：
    currentMenu: 1,

    //当前请求uri
    currentRequestUri: function () {
        switch (file.currentMenu) {
            case file.CURRENT_MENU_USER:
                return file.DISK_FILE_USER_URI;
            case file.CURRENT_MENU_SCHOOL:
                return file.DISK_FILE_SCHOOL_URI;
            case file.CURRENT_MENU_USER_SHARE:
                return file.DISK_FILE_USER_SHARE_URI;
            case file.CURRENT_MENU_SCHOOL_COOPERATE_MINE:
                return file.DISK_FILE_SCHOOL_COOPERATE_MINE_URI;
            case file.CURRENT_MENU_SCHOOL_ROLE:
                return file.DISK_FILE_SCHOOL_ROLE_URI;
            case file.CURRENT_MENU_SCHOOL_COOPERATE_JOIN:
                return file.DISK_FILE_SCHOOL_COOPERATE_JOIN_URI;
        }
    },

    //文件上传状态
    UPLOAD_STATUS_CANCEL: 5,           //取消上传
    UPLOAD_STATUS_WAITING: 4,          //等待
    UPLOAD_STATUS_REJECT: 3,           //拒绝
    UPLOAD_STATUS_SUCCESS: 2,          //成功
    UPLOAD_STATUS_RUNNING: 1,          //正在上传
    UPLOAD_STATUS_FAILED: 0,           //失败

    //文件预览方式，及对应的类型。对应于 FileMediaSubTypeEnum.java 中的 mediaSubType
    preview: {
        PDF: [101, 102],
        IMAGE: [301],
        VIDEO: [501],
        AUDIO: [401],
        WORD: [103],
        EXCEL: [105],
        PPT: [104],
    },

    //最多允许导入/转存文件
    MAX_FILE_NUM_IMPORT: 10000,
    //同时上传文件最大数
    ONCE_MAX_FILE_UPLOAD_COUNT: 3,
    //需要模拟上传百分比的文件大小
    NEED_MOCK_FILE_SIZE: 10 * 1024 * 1024,
    //需要设置上传百分比为0的文件大小
    NEED_ZERO_UPLOAD_PERCENT_MOCK_FILE_SIZE: 500 * 1024 * 1024,
    //访问路径最大显示级数
    MAX_FILE_VISIT_PATH_COUNT: 4,

    /**
     * 从个人文件导入学校文件对象
     * 从学校文件转存到个人文件对象
     * @param id
     * @param folder
     */
    fileImportItem: function (id, folder) {
        this.id = id;
        this.folder = folder;
    },

    /**
     * 存留在cookie中的临时用户分享链接查看token
     */
    COOKIE_SHARE_TOKEN: "share-token",

    /**
     * 文件名中的非法字符
     */
    FILE_NAME_EXCLUDE_CHAR: ["\\", "/", ":", "*", "?", "\"", "<", ">", "|"],
    /**
     * 校验指定的文件名是否包含非法字符
     */
    validateFilename: function (filename) {
        for (var i = 0; i < file.FILE_NAME_EXCLUDE_CHAR.length; i++) {
            if (filename.indexOf(file.FILE_NAME_EXCLUDE_CHAR[i]) > 0) {
                return false;
            }
        }

        return true;
    },
    /**
     * 学校文件操作权限值，用于学校文件列表按钮状态判定
     */
    SchoolFileResourceType: {
        FOLDER_LIST: 1,
        FOLDER_UPLOAD: 2,
        FOLDER_CREATE_NORMAL_FOLDER: 4,
        FOLDER_CREATE_COOPERATE_FOLDER: 8,
        FOLDER_IMPORT_USER_FILE: 16,
        FILE_DOWNLOAD: 32,
        FILE_DELETE: 64,
        FILE_RESTORE_USER_FILE: 128,
        FILE_MOVE: 256,
        FILE_RENAME: 512,
        FILE_VIEW_DESC: 1024,
        FILE_EDIT_DESC: 2048,
        FILE_VIEW_MEMBER: 4096,
        FILE_EDIT_MEMBER: 8192,
        FILE_PREVIEW: 16384,
        COOPERATE_FIRST_FOLDER_STOP: 32768,
        FILE_SHARE: 65536,
    },

    /**
     * 当用户没有权限时，给按钮添加的额外类名
     */
    NO_AUTH_CLASS_NAME: "no-auth",
};
/**
 * 迎检管理
 */
var diskCheck = diskCheck || {
    /**
     * 迎检状态
     */
    CHECK_RECORD_STATUS_RUNNING: 1,
    CHECK_RECORD_STATUS_FROZEN: 2,
    CHECK_RECORD_STATUS_STOP: 3,
    CHECK_RECORD_STATUS_FINISH: 4,

    /**
     * 存留在cookie中的临时用户访问链接查看token
     */
    COOKIE_CHECK_VISIT_TOKEN: "check-visit-token",

    /**
     * 迎检类别操作权限值，用于迎检类别列表按钮状态判定
     */
    DiskCheckTypeResourceType : {
        LIST: 1,
        CREATE: 2,
        RENAME: 4,
        DELETE: 8,
    },

    /**
     * 迎检记录操作权限值，用于迎检记录列表按钮状态判定
     */
    DiskCheckRecordResourceType : {
        LIST: 1,
        CREATE: 2,
        DELETE: 4,
        VIEW: 8,
        EDIT_END_TIME: 16,
        SET: 32,
        FROZEN: 64,
        FINISH: 128,
        CREATE_FOLDER: 256,
        MOVE_FOLDER: 512,
        EXPORT_EXCEL: 1024,
        VIEW_TRANSFORM: 2048,
    },

    /**
     * 迎检记录指标目录操作权限值，用于迎检记录指标列表按钮状态判定
     */
    DiskCheckRecordFolderResourceType : {
        TARGET_DELETE: 1,
        TARGET_RENAME: 2,
        TARGET_VIEW_DESC: 4,
        TARGET_EDIT_DESC: 8,
        TARGET_VIEW_MEMBER: 16,
        TARGET_EDIT_MEMBER: 32,
        FILE_LIST: 64,
        FILE_PREVIEW: 128,
        FILE_IMPORT: 256,
        FILE_UPLOAD: 512,
        FILE_RENAME: 1024,
        FILE_MOVE: 2048,
        FILE_DELETE: 4096,
        TARGET_EDIT_STATUS: 8192,
        TARGET_FOLDER_CREATE: 16384,
    },
    /**
     * 迎检目录用户角色
     */
    DiskCheckFolderRoleType: {
        ADMIN: 1,
        ASSISTANT: 2,
        CHARGER: 3,
        COOPERATER: 4,
    },
    /**
     * 当用户没有权限时，给按钮添加的额外类名
     */
    NO_AUTH_CLASS_NAME: "no-auth",

    /**
     * 文件列表更新类型：1 文件数变化，2 目录状态变化
     */
    CHECK_RECORD_FILE_REFRESH_FILE_COUNT: 1,
    CHECK_RECORD_FILE_REFRESH_FOLDER_STATUS: 2,
};