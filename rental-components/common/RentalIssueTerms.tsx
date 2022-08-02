export interface RentalIssueTermsParams
  extends React.HTMLAttributes<HTMLDivElement> {
  confirmed: boolean
}

export const RentalIssueTerms: React.FC<RentalIssueTermsParams> = ({
  confirmed,
  ...props
}: RentalIssueTermsParams) => {
  return (
    <div {...props} className="flex cursor-pointer gap-3 text-sm">
      <div
        className={`h-5 w-5 shrink-0 rounded-md border-[2px] border-border transition-all ${
          confirmed ? 'bg-primary' : ''
        }`}
      />
      <div>
        I have thoroughly reviewed and understood the listing parameters
        specified.
      </div>
    </div>
  )
}
