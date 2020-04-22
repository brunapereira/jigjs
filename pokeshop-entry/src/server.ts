import express from 'express';
import {FragmentResolver} from "./services/fragment-resolver";
import {renderHome} from "./views/home";
import {FrontEndService} from "./services/front-end.service";

const app = express();
const frontEndService = new FrontEndService();

app.use(express.static('dist'));

app.get('/', (req, res) => {
    renderHome(new FragmentResolver(), frontEndService)
        .then((view) => {
            res.send(view);
        });
});

console.log('Registering dependencies');

frontEndService.register('http://localhost:3001/').then(() => {
    console.log('starting server');

    app.listen(4200, function () {
        console.log('Example app listening on port http://localhost:4200!');
    });

})
