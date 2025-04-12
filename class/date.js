module.exports = class date {
    static date() {
        let date = new Date()
        const mois = {
            0: "janvier",
            1: "février",
            2: "mars",
            3: "avril",
            4: "mai",
            5: "juin",
            6: "juillet",
            7: "août",
            8: "septembre",
            9: "octobre",
            10: "novembre",
            11: "décembre"
        }
        const jour = {
            1: "Lundi",
            2: "Mardi",
            3: "Mercredi",
            4: "Jeudi",
            5: "Vendredi",
            6: "Samedi",
            0: "Dimanche"
        }
        let datetxt = `${jour[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} ${date.getHours()}:${date.getMinutes()}`
        return datetxt
    }   
}