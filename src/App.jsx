import * as React from './react-dist/react';
import Counter from './components/Counter';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = { step: 0 };
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState(
            (state) => {
                return { step: state.step + 1 };
            },
            () => {
                console.log('[App] this.setState callback');
            }
        );
    }
    static getDerivedStateFromProps(props, state) {
        console.log('[App] getDerivedStateFromProps ');
        return null;
    }
    getSnapshotBeforeUpdate(prevProps, prevState) {
        const btn = document.getElementById('btn');
        const scrollHeight = btn.scrollHeight;
        console.log('[App] getSnapshotBeforeUpdate ', scrollHeight);
        return scrollHeight;
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        console.log('[App] componentDidUpdate ', snapshot);
    }
    componentDidMount() {
        console.log('[App] componentDidMount ');
    }
    componentWillUnmount() {
        console.log('[App] componentWillUnmount ');
    }
    UNSAFE_componentWillMount() {
        console.log('[App] UNSAFE_componentWillMount ');
    }
    UNSAFE_componentWillReceiveProps(nextProps) {
        console.log('[App] UNSAFE_componentWillReceiveProps ', nextProps);
    }
    UNSAFE_componentWillUpdate(nextProps, nextState) {
        console.log('[App] UNSAFE_componentWillUpdate ', nextProps, nextState);
    }
    shouldComponentUpdate() {
        console.log('[App] shouldComponentUpdate ');
        return true;
    }

    render() {
        return (
            <React.Fragment>
                {(!this.state.step || this.state.step % 3) && (
                    <Counter step={this.state.step} />
                )}
                <button id="btn" key="2" onClick={this.handleClick}>
                    类组件按钮：{this.state.step}
                </button>
            </React.Fragment>
        );
    }
}
