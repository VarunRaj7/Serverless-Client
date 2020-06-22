import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import DatePicker from 'react-datepicker'
import moment from 'moment'

import 'react-datepicker/dist/react-datepicker.css'
import '../App.css'

import imgIcon from '../img/imgIcon.png'
import flagIcon0 from '../img/flag0.png'
import flagIcon1 from '../img/flag1.png'

import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Popup
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  newTodoDueDate: string
  loadingTodos: boolean
  startdate: Date
  lastEvaluatedKey?: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    newTodoDueDate: moment(new Date()).format().substring(0, 10), //new Date().toISOString().substring(0, 10),
    loadingTodos: true,
    startdate: new Date()
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  handleDateChange = (date: Date) => {
    this.setState({ startdate: date })
    //console.log(date.toISOString())
    //console.log(date.toISOString().substring(0, 10))
    this.setState({ newTodoDueDate: moment(date).format().substring(0, 10) })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate: this.state.newTodoDueDate
      })
      const resp = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos: resp.todos, //[...this.state.todos, newTodo],
        newTodoName: '',
        lastEvaluatedKey: resp.lastEvaluatedKey
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter((todo) => todo.todoId != todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done,
        pflag: todo.pflag
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoPflag = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: todo.done,
        pflag: !todo.pflag
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { pflag: { $set: !todo.pflag } }
        })
      })
    } catch {
      alert('Todo Priority change failed')
    }
  }

  onTodoShowMore = async () => {
    const resp = await getTodos(
      this.props.auth.getIdToken(),
      undefined,
      this.state.lastEvaluatedKey
    )
    this.setState((state) => {
      const todos = [...state.todos, ...resp.todos]
      return { todos: todos, lastEvaluatedKey: resp.lastEvaluatedKey }
    })
  }

  async componentDidMount() {
    try {
      const resp = await getTodos(this.props.auth.getIdToken())
      console.log(resp)
      this.setState({
        todos: resp.todos,
        loadingTodos: false,
        lastEvaluatedKey: resp.lastEvaluatedKey
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1" textAlign="center" style={{ paddingTop: '3%' }}>
          TODOs
        </Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}

        {this.renderNextButton()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <React.Fragment>
        <Header as="h3">Create new Todos</Header>
        <Grid.Row style={{ display: 'flex' }}>
          <Grid.Column>
            <DatePicker
              dateFormat="yyyy/MM/dd"
              selected={this.state.startdate}
              onChange={this.handleDateChange}
            />
          </Grid.Column>
          <Grid.Column style={{ width: '85%', marginLeft: '2%' }}>
            <Input
              action={{
                color: 'teal',
                labelPosition: 'right',
                icon: 'add',
                content: 'New task',
                onClick: this.onTodoCreate
              }}
              fluid
              // actionPosition="left"
              placeholder="To change the world..."
              onChange={this.handleNameChange}
            />
          </Grid.Column>
        </Grid.Row>
        <Divider />
      </React.Fragment>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    console.log(this.state.todos)
    return (
      <Grid padded>
        <Header as="h3">Your Todos</Header>
        <Grid.Row>
          <Grid.Column width={1} verticalAlign="middle">
            <Header as="h5">Done</Header>
          </Grid.Column>
          <Grid.Column width={9} verticalAlign="middle">
            <Header as="h5">Task</Header>
          </Grid.Column>
          <Grid.Column width={3} floated="right" verticalAlign="middle">
            <Header as="h5">Due Date</Header>
          </Grid.Column>
          <Grid.Column width={1} floated="right">
            <Header as="h5">Priority</Header>
          </Grid.Column>
          <Grid.Column width={1} floated="right">
            <Header as="h5">File</Header>
          </Grid.Column>
          <Grid.Column width={1} floated="right">
            <Header as="h5">Delete</Header>
          </Grid.Column>
          <Grid.Column width={16}>
            <Divider />
          </Grid.Column>
        </Grid.Row>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={9} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right" verticalAlign="middle">
                {todo.dueDate == moment(new Date()).format().substring(0, 10)
                  ? 'Today'
                  : todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                {todo.pflag ? (
                  <Image
                    src={flagIcon1}
                    size="mini"
                    onClick={() => this.onTodoPflag(pos)}
                  />
                ) : (
                  <Image
                    src={flagIcon0}
                    size="mini"
                    onClick={() => this.onTodoPflag(pos)}
                  />
                )}
              </Grid.Column>
              {todo.attachmentUrl == undefined ? (
                <Grid.Column width={1} floated="right">
                  <Button
                    icon
                    color="blue"
                    onClick={() => this.onEditButtonClick(todo.todoId)}
                  >
                    <Icon name="pencil" />
                  </Button>
                </Grid.Column>
              ) : (
                <Grid.Column width={1} floated="right">
                  <Popup
                    content={
                      <Image src={todo.attachmentUrl} size="small" wrapped />
                    }
                    trigger={<Image src={imgIcon} />}
                  />
                </Grid.Column>
              )}
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {/* {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )} */}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  renderNextButton() {
    return (
      <Grid>
        <Grid.Column textAlign="center">
          <Button
            color="blue"
            onClick={() => this.onTodoShowMore()}
            textalign="center"
            size="big"
          >
            Show More
          </Button>
        </Grid.Column>
      </Grid>
    )
  }
}
