import { Button, Form, InputNumber } from 'antd'
import style from './Dropdowns.module.scss'
import { NumberFormatter, stringToNumber } from '../../../utils'

interface PriceFilterDropdownProps {
  minPrice?: string,
  maxPrice?: string
  onSubmit: (data: {minPrice: string, maxPrice: string}) => void
}

const PriceFilterDropdown = ({
  minPrice,
  maxPrice,
  onSubmit,
}: PriceFilterDropdownProps) => {
  const [form] = Form.useForm()

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      className={style.Dropdown}
      initialValues={{
        minPrice,
        maxPrice,
      }}
    >
      <span className={style.DropdownTitle}>Prezzo</span>
      <div className={style.Range}>
        <Form.Item name="minPrice" noStyle>
          <InputNumber
            addonAfter="€"
            controls={false}
            placeholder="Min"
            formatter={(value) => (value ? NumberFormatter.format(value) : '')}
            parser={(value?: string) => (value ? stringToNumber(value) : '')}
          />
        </Form.Item>
        <span className={style.RangeDash}>–</span>
        <Form.Item name="maxPrice" noStyle>
          <InputNumber
            addonAfter="€"
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
            form.setFieldsValue({ minPrice: undefined, maxPrice: undefined })
            onSubmit({ minPrice: '', maxPrice: '' })
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

export { PriceFilterDropdown }
