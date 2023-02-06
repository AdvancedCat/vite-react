import * as React from './react-dist/react';
import MainPage from './pages/main'

export default class App extends React.Component {
    render() {
        return (
            <React.Fragment>
                <MainPage></MainPage>
            </React.Fragment>
        );
    }
}
