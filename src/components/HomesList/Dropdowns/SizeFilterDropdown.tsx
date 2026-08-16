import { Button, Form, InputNumber } from 'antd'
import style from './Dropdowns.module.scss'
import { NumberFormatter, stringToNumber } from '../../../utils'

interface SizeFilterDropdownProps {
  minSize?: string,
  maxSize?: string
  onSubmit: (data: {minSize: string, maxSize: string}) => void
}

const SizeFilterDropdown = ({
  minSize,
  maxSize,
  onSubmit,
}: SizeFilterDropdownProps) => {
  const [form] = Form.useForm()

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      className={style.Dropdown}
      initialValues={{
        minSize,
        maxSize,
      }}
    >
      <span className={style.DropdownTitle}>Superficie</span>
      <div className={style.Range}>
        <Form.Item name="minSize" noStyle>
          <InputNumber
            addonAfter="m²"
            controls={false}
            placeholder="Min"
            formatter={(value) => (value ? NumberFormatter.format(value) : '')}
            parser={(value?: string) => (value ? stringToNumber(value) : '')}
          />
        </Form.Item>
        <span className={style.RangeDash}>–</span>
        <Form.Item name="maxSize" noStyle>
          <InputNumber
            addonAfter="m²"
            controls={false}
            placeholder="Max"
            formatter={(value) => (value ? NumberFormatter.format(value) : '')}
            parser={(value?: string) => (value ? stringToNumber(value) : '')}
          />
        </Form.Item>
      </div>
      <div className={style.DropdownActions}>
        <Button
          type="text"
          onClick={() => {
            form.resetFields()
            form.setFieldsValue({ minSize: undefined, maxSize: undefined })
            onSubmit({ minSize: '', maxSize: '' })
          }}
        >
          Azzera
        </Button>
        <Button type="primary" htmlType="submit">
          Applica
        </Button>
      </div>
    </Form>
  )
}

export { SizeFilterDropdown }
