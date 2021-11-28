import {default as axios} from "axios";

(async () => {


    axios.delete("https://api.heroku.com/apps/deadsnakebot/dynos/worker", {
        headers: {
            "Authorization": `Bearer 45ffd285-3175-4c52-8493-20edb3653fb9`,
            "Accept": "application/vnd.heroku+json; version=3",
        }
    }).then((res) => {
        console.log(res.statusText);
        console.log(JSON.stringify(res.data));
    }).catch((err) => {
        console.log(err)
    })
})()