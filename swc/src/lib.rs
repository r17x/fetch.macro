use swc_core::{
    common::DUMMY_SP,
    ecma::ast::{
        BlockStmtOrExpr, CallExpr, Callee, Expr, ExprOrSpread, Ident, ImportDecl, ImportSpecifier,
        Lit, ModuleDecl, ModuleItem, Pat, Program, Str, TaggedTpl, TplElement,
    },
    ecma::visit::{Fold, FoldWith},
    ecma::{ast::ArrowExpr, transforms::testing::test},
    ecma::{ast::BindingIdent, atoms::JsWord},
    plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
};

pub struct FetchMacro {
    import_specifier: String,
}

fn ident(value: String) -> Ident {
    Ident {
        span: DUMMY_SP,
        sym: JsWord::from(value),
        optional: false,
    }
}

impl FetchMacro {
    pub fn new() -> Self {
        FetchMacro {
            import_specifier: String::new(),
        }
    }

    fn replace_with_fetch_function(&mut self, url: String) -> Expr {
        Expr::Arrow(ArrowExpr {
            span: DUMMY_SP,
            params: [Pat::Ident(BindingIdent {
                id: ident("opts".to_string()),
                type_ann: None,
            })]
            .to_vec(),
            body: BlockStmtOrExpr::Expr(Box::new(Expr::Call(CallExpr {
                span: DUMMY_SP,
                callee: Callee::Expr(Box::new(Expr::Ident(ident("fetch".to_string())))),
                args: [
                    Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: JsWord::from(url),
                        raw: None,
                    })),
                    Expr::Ident(ident("opts".to_string())),
                ]
                .map(|f| ExprOrSpread {
                    spread: None,
                    expr: Box::new(f),
                })
                .to_vec(),

                type_args: None,
            }))),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        })
    }
}

impl Fold for FetchMacro {
    // Implement necessary fold_* methods for actual custom transform.
    // A comprehensive list of possible fold methods can be found here:
    // https://rustdoc.swc.rs/swc_ecma_visit/trait.Fold.html
    fn fold_import_decl(&mut self, id: ImportDecl) -> ImportDecl {
        let mut id = id.fold_children_with(self);

        let _ = id.specifiers.iter_mut().for_each(|i| {
            match (id.src.value.to_string().eq("fetch.macro"), i) {
                (true, ImportSpecifier::Default(sp)) => {
                    self.import_specifier = sp.local.sym.to_string()
                }
                _ => {}
            }
        });

        id
    }

    fn fold_expr(&mut self, expr: Expr) -> Expr {
        let expr = expr.fold_children_with(self);

        match &expr {
            Expr::TaggedTpl(TaggedTpl { tag, tpl, .. }) => match &**tag {
                Expr::Ident(Ident { sym, .. }) => {
                    if sym.to_string().eq(&self.import_specifier.to_string()) {
                        match tpl.quasis.first() {
                            Some(TplElement {
                                cooked: Some(cooked),
                                ..
                            }) => {
                                if cooked.to_string().is_empty() {
                                    expr
                                } else {
                                    self.replace_with_fetch_function(cooked.to_string())
                                }
                            }
                            _ => expr,
                        }
                    } else {
                        expr
                    }
                }
                _ => expr,
            },
            _ => expr,
        }
    }

    // remove import source fetch.macro
    fn fold_module_items(&mut self, ims: Vec<ModuleItem>) -> Vec<ModuleItem> {
        let mut ims = ims.fold_children_with(self);

        ims.retain(|m| match &m {
            ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl { src, .. })) => {
                !src.value.to_string().eq(&"fetch.macro".to_string())
            }
            _ => true,
        });

        ims.to_vec()
    }
}

/// An example plugin function with macro support.
/// `plugin_transform` macro interop pointers into deserialized structs, as well
/// as returning ptr back to host.
///
/// It is possible to opt out from macro by writing transform fn manually
/// if plugin need to handle low-level ptr directly via
/// `__transform_plugin_process_impl(
///     ast_ptr: *const u8, ast_ptr_len: i32,
///     unresolved_mark: u32, should_enable_comments_proxy: i32) ->
///     i32 /*  0 for success, fail otherwise.
///             Note this is only for internal pointer interop result,
///             not actual transform result */`
///
/// This requires manual handling of serialization / deserialization from ptrs.
/// Refer swc_plugin_macro to see how does it work internally.
#[plugin_transform]
pub fn process_transform(program: Program, _metadata: TransformPluginProgramMetadata) -> Program {
    program.fold_with(&mut FetchMacro::new())
}

// An example to test plugin transform.
// Recommended strategy to test plugin's transform is verify
// the Visitor's behavior, instead of trying to run `process_transform` with mocks
// unless explicitly required to do so.
test!(
    Default::default(),
    |_| FetchMacro::new(),
    boo,
    // Input codes
    r#"import f from "fetch.macro"; 
const fetcher = f`/api/v1/ping`;"#,
    // Output codes after transformed with plugin
    r#"const fetcher = (opts) => fetch("/api/v1/ping", opts);"#
);
