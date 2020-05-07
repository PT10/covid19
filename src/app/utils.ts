export class Utils {
    static formatDate(date:Date) {
        return ("0" + (date.getMonth() + 1)).slice(-2) + '/' + ("0" + date.getDate()).slice(-2) + '/' + date.getFullYear();
    }
    
    static formatDateForFileName(date:Date) {
        return ("0" + (date.getMonth() + 1)).slice(-2) + '_' + ("0" + date.getDate()).slice(-2) + '_' + date.getFullYear();
    }

    static getDateMonth(date:Date) {
        return ("0" + (date.getMonth() + 1)).slice(-2) + '/' + ("0" + date.getDate()).slice(-2);
    }
}