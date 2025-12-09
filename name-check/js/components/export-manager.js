// 导出管理器组件
class ExportManager {
    constructor(exportService) {
        this.exportService = exportService;
    }

    /**
     * 导出数据
     */
    export() {
        // 获取导出选项
        const startDate = document.getElementById('exportStartDate')?.value;
        const endDate = document.getElementById('exportEndDate')?.value;
        const format = document.querySelector('input[name="format"]:checked')?.value || 'csv';

        const options = {
            exportAttendance: document.getElementById('exportAttendance')?.checked || false,
            exportStudents: document.getElementById('exportStudents')?.checked || false,
            exportStatistics: document.getElementById('exportStatistics')?.checked || false
        };

        // 检查是否选择了至少一个选项
        if (!options.exportAttendance && !options.exportStudents && !options.exportStatistics) {
            alert('请至少选择一个导出内容');
            return;
        }

        // 检查日期范围
        if (!startDate || !endDate) {
            alert('请选择日期范围');
            return;
        }

        try {
            if (options.exportStudents) {
                this.exportService.exportAndDownload('students', {
                    startDate: startDate,
                    endDate: endDate,
                    format: format
                });
            }

            if (options.exportAttendance) {
                this.exportService.exportAndDownload('attendance', {
                    startDate: startDate,
                    endDate: endDate,
                    format: format
                });
            }

            if (options.exportStatistics) {
                this.exportService.exportAndDownload('statistics', {
                    startDate: startDate,
                    endDate: endDate,
                    format: format
                });
            }

            alert('导出成功！');
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败: ' + error.message);
        }
    }

    /**
     * 创建备份
     */
    createBackup() {
        try {
            const backup = this.exportService.createBackup();
            const backupContent = JSON.stringify(backup, null, 2);
            const filename = `backup_${DateUtils.format(new Date(), 'YYYY-MM-DD_HH-mm-ss')}.json`;

            // 下载备份文件
            const blob = new Blob([backupContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);

            alert('备份创建成功！');
        } catch (error) {
            console.error('备份失败:', error);
            alert('备份失败: ' + error.message);
        }
    }

    /**
     * 显示导入备份对话框
     */
    showImportBackupDialog() {
        const content = `
            <div class="import-backup-dialog">
                <p>选择备份文件进行恢复：</p>
                <input type="file" id="backupFileInput" accept=".json">
                <div class="checkbox-group">
                    <label>
                        <input type="checkbox" id="mergeBackup">
                        合并到现有数据（否则将覆盖）
                    </label>
                </div>
            </div>
        `;

        window.app.showModal('导入备份', content);

        // 绑定事件
        setTimeout(() => {
            const fileInput = document.getElementById('backupFileInput');
            const mergeCheckbox = document.getElementById('mergeBackup');

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importBackup(file, mergeCheckbox.checked);
                }
            });
        }, 100);
    }

    /**
     * 导入备份
     * @param {File} file - 备份文件
     * @param {boolean} merge - 是否合并
     */
    importBackup(file, merge = false) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                const success = this.exportService.restoreBackup(backupData, merge);

                if (success) {
                    alert('备份导入成功！页面将刷新。');
                    window.location.reload();
                } else {
                    alert('备份导入失败');
                }
            } catch (error) {
                console.error('导入备份失败:', error);
                alert('备份导入失败: ' + error.message);
            }
        };

        reader.readAsText(file);
    }
}